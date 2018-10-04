'use strict';

const EventEmitter = require('events');
const asyncHooks = require('async_hooks');
const Metrics = require('@metrics/client');
const assert = require('assert');
const abslog = require('abslog');
const Breaker = require('./breaker');
const errors = require('./error');

const CircuitB = class CircuitB extends EventEmitter {
    constructor({
        maxFailures = 5, maxAge = 5000, timeout = 20000, logger = undefined,
    } = {}) {
        super();

        assert(Number.isInteger(maxFailures), `Provided value, ${maxFailures}, to argument "maxFailures" is not a number`);
        assert(Number.isInteger(timeout), `Provided value, ${timeout}, to argument "timeout" is not a number`);
        assert(Number.isInteger(maxAge), `Provided value, ${maxAge}, to argument "maxAge" is not a number`);

        Object.defineProperty(this, 'registry', {
            value: new Map(),
        });

        Object.defineProperty(this, 'maxAge', {
            value: maxAge,
        });

        Object.defineProperty(this, 'timeout', {
            value: timeout,
        });

        Object.defineProperty(this, 'maxFailures', {
            value: maxFailures,
        });

        Object.defineProperty(this, 'metrics', {
            enumerable: true,
            value: new Metrics(),
        });

        Object.defineProperty(this, 'log', {
            value: abslog(logger),
        });

        const hooks = {
            init: (asyncId, type, triggerAsyncId, resource) => {
                if (type === 'TCPWRAP') {
                    process.nextTick(() => {
                        let breaker;
                        let timer;
                        let tripped = false;

                        // "lookup" happens before net connect, everything after this is
                        // too late to be used to prevent that a net connection is made.
                        resource.owner.once('lookup', (err, address, family, host) => {
                            if (this.registry.has(host)) {
                                breaker = this.registry.get(host);

                                if (breaker.check()) {
                                    this.log.debug('Circuit breaker is open', breaker.host, asyncId);
                                    resource.owner.destroy(new errors.CircuitBreakerOpenExceptionError(`Circuit breaker is open for host: ${breaker.host}`));
                                    return;
                                }

                                timer = setTimeout(() => {
                                    this.log.debug('Circuit breaker triggered timeout', breaker.host, asyncId);
                                    resource.owner.destroy(new errors.CircuitBreakerTimeoutError(`Circuit breaker triggered timed out for host: ${breaker.host}`));
                                }, breaker.timeout);
                            }
                        });

                        resource.owner.once('error', (error) => {
                            if (tripped) {
                                return;
                            }

                            if (breaker) {
                                this.log.debug('Circuit breaker got "error" event on resource', breaker.host, asyncId);
                                if (error instanceof errors.CircuitBreakerOpenExceptionError) {
                                    return;
                                }

                                clearTimeout(timer);
                                tripped = breaker.trip();
                            }
                        });

                        resource.owner.once('timeout', () => {
                            if (tripped) {
                                return;
                            }

                            if (breaker) {
                                this.log.debug('Circuit breaker got "timeout" event on resource', breaker.host, asyncId);
                                tripped = breaker.trip();
                                clearTimeout(timer);
                            }
                        });

                        resource.owner.once('abort', () => {
                            if (tripped) {
                                return;
                            }

                            if (breaker) {
                                this.log.debug('Circuit breaker got "abort" event on resource', breaker.host, asyncId);
                                tripped = breaker.trip();
                                clearTimeout(timer);
                            }
                        });

                        resource.owner.once('data', () => {
                            if (breaker) {
                                clearTimeout(timer);
                            }
                        });

                        resource.owner.once('end', () => {
                            if (tripped) {
                                return;
                            }

                            if (breaker) {
                                // eslint-disable-next-line no-underscore-dangle
                                const httpMsg = resource.owner._httpMessage;

                                if (!httpMsg || !httpMsg.res) {
                                    this.log.debug('Circuit breaker got "end" event on resource - "http message" is missing', breaker.host, asyncId);
                                    tripped = breaker.trip();
                                    return;
                                }

                                const code = httpMsg.res.statusCode;

                                if (code >= 400 && code <= 499) {
                                    this.log.debug('Circuit breaker got "end" event on resource - http status is 4xx', breaker.host, asyncId);
                                    tripped = breaker.trip();
                                    return;
                                }

                                if (code >= 500 && code <= 599) {
                                    this.log.debug('Circuit breaker got "end" event on resource - http status is 5xx', breaker.host, asyncId);
                                    tripped = breaker.trip();
                                    return;
                                }

                                this.log.debug('Circuit breaker got "end" event on resource - http status is 2xx', breaker.host, asyncId);
                                breaker.reset();
                            }
                        });
                    });
                }
            },
        };

        Object.defineProperty(this, 'hook', {
            value: asyncHooks.createHook(hooks),
        });
    }

    get [Symbol.toStringTag]() {
        return 'CircuitB';
    }

    enable() {
        this.log.debug('Circuit breaker enabled AsyncHook');
        this.hook.enable();
    }

    disable() {
        this.log.debug('Circuit breaker disabled AsyncHook');
        this.hook.disable();
    }

    set(host, {
        maxFailures = this.maxFailures,
        maxAge = this.maxAge,
        timeout = this.timeout,
    } = {}) {
        const breaker = new Breaker(host, { maxFailures, maxAge, timeout });
        breaker.on('open', (hostname) => {
            this.emit('open', hostname);
        });
        breaker.on('half_open', (hostname) => {
            this.emit('open', hostname);
        });
        breaker.on('closed', (hostname) => {
            this.emit('closed', hostname);
        });

        this.registry.set(host, breaker);
        breaker.metrics.pipe(this.metrics);
    }

    del(host) {
        if (this.registry.has(host)) {
            const breaker = this.registry.get(host);
            breaker.metrics.unpipe(this.metrics);
        }
        return this.registry.delete(host);
    }
};

module.exports = CircuitB;
