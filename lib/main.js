'use strict';

const EventEmitter = require('events');
const asyncHooks = require('async_hooks');
const response = require('./response');
const Metrics = require('@metrics/client');
const assert = require('assert');
const abslog = require('abslog');
const Breaker = require('./breaker');
const errors = require('./error');
const utils = require('./utils');

const hook = Symbol('_hook');

const CircuitB = class CircuitB extends EventEmitter {
    constructor({
        maxFailures = 5,
        onResponse = response,
        timeout = 20000,
        maxAge = 5000,
        logger = undefined,
    } = {}) {
        super();

        assert(Number.isInteger(maxFailures), `Provided value, ${maxFailures}, to argument "maxFailures" is not a number`);
        assert(Number.isInteger(timeout), `Provided value, ${timeout}, to argument "timeout" is not a number`);
        assert(Number.isInteger(maxAge), `Provided value, ${maxAge}, to argument "maxAge" is not a number`);
        assert(utils.isFunction(onResponse), `Provided value to argument "onResponse" is not a function`);

        Object.defineProperty(this, 'registry', {
            value: new Map(),
        });

        Object.defineProperty(this, 'maxAge', {
            value: maxAge,
        });

        Object.defineProperty(this, 'timeout', {
            value: timeout,
        });

        Object.defineProperty(this, 'onResponse', {
            value: onResponse,
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

        Object.defineProperty(this, 'hook', {
            value: asyncHooks.createHook({
                init: this[hook].bind(this),
            }),
        });
    }

    get [Symbol.toStringTag]() {
        return 'CircuitB';
    }

    [hook](asyncId, type, triggerAsyncId, resource) {
        if (type !== 'TCPWRAP') {
            return;
        }

        process.nextTick(() => {
            // "lookup" happens before net connect, everything after this is
            // too late to be used to prevent that a net connection is made.
            resource.owner.once('lookup', (err, address, family, host) => {
                this.log.trace('==================================', asyncId);
                if (this.registry.has(host)) {
                    const breaker = this.registry.get(host);
                    let tripped = false;

                    this.log.trace('Circuit breaker has host', breaker.host, asyncId);

                    if (breaker.check()) {
                        this.log.debug('Circuit breaker is open', breaker.host, asyncId);
                        resource.owner.destroy(new errors.CircuitBreakerOpenExceptionError(`Circuit breaker is open for host: ${breaker.host}`));
                        return;
                    }

                    let timer = setTimeout(() => {
                        this.log.debug('Circuit breaker triggered timeout', breaker.host, asyncId);
                        resource.owner.destroy(new errors.CircuitBreakerTimeoutError(`Circuit breaker triggered timed out for host: ${breaker.host}`));
                    }, breaker.timeout);

                    resource.owner.once('error', (error) => {
                        if (tripped) {
                            this.log.trace('Circuit breaker tripped in "error" event', breaker.host, asyncId);
                            return;
                        }

                        if (timer) {
                            this.log.trace('Circuit breaker clear timeout in "error" event', breaker.host, asyncId);
                            clearTimeout(timer);
                            timer = null;
                        }

                        if (breaker) {
                            if (error instanceof errors.CircuitBreakerOpenExceptionError) {
                                this.log.debug('Circuit breaker got "CircuitBreakerOpenExceptionError" event on resource', breaker.host, asyncId);
                                return;
                            }

                            this.log.debug('Circuit breaker got "error" event on resource', breaker.host, asyncId);
                            tripped = breaker.trip();
                        }
                    });

                    resource.owner.once('timeout', () => {
                        if (tripped) {
                            this.log.trace('Circuit breaker tripped in "timeout" event', breaker.host, asyncId);
                            return;
                        }

                        if (timer) {
                            this.log.trace('Circuit breaker clear timeout in "timeout" event', breaker.host, asyncId);
                            clearTimeout(timer);
                            timer = null;
                        }

                        if (breaker) {
                            this.log.debug('Circuit breaker got "timeout" event on resource', breaker.host, asyncId);
                            tripped = breaker.trip();
                        }
                    });

                    resource.owner.once('abort', () => {
                        if (tripped) {
                            this.log.trace('Circuit breaker tripped in "abort" event', breaker.host, asyncId);
                            return;
                        }

                        if (breaker) {
                            this.log.debug('Circuit breaker got "abort" event on resource', breaker.host, asyncId);
                            tripped = breaker.trip();
                        }
                    });

                    resource.owner.once('data', () => {
                        if (timer) {
                            this.log.trace('Circuit breaker clear timeout in "data" event', breaker.host, asyncId);
                            clearTimeout(timer);
                            timer = null;
                        }

                        if (breaker) {
                            this.log.debug('Circuit breaker got "data" event on resource', breaker.host, asyncId);
                        }
                    });

                    resource.owner.once('end', () => {
                        if (tripped) {
                            this.log.trace('Circuit breaker tripped in "end" event', breaker.host, asyncId);
                            return;
                        }

                        if (timer) {
                            this.log.trace('Circuit breaker clear timeout in "end" event', breaker.host, asyncId);
                            clearTimeout(timer);
                            timer = null;
                        }

                        if (breaker) {
                            // eslint-disable-next-line no-underscore-dangle
                            const httpMsg = resource.owner._httpMessage;

                            if (!httpMsg || !httpMsg.res) {
                                this.log.debug('Circuit breaker got "end" event on resource - "http message" is missing', breaker.host, asyncId);
                                tripped = breaker.trip();
                                return;
                            }

                            if (breaker.onResponse(httpMsg.res)) {
                                this.log.debug(`Circuit breaker got "end" event on resource - http status is ${httpMsg.res.statusCode}`, breaker.host, asyncId);
                                tripped = breaker.trip();
                                return;
                            }

                            this.log.debug(`Circuit breaker got "end" event on resource - http status is ${httpMsg.res.statusCode}`, breaker.host, asyncId);
                            breaker.reset();
                        }
                    });
                }
            });
        });
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
        onResponse = this.onResponse,
        timeout = this.timeout,
        maxAge = this.maxAge,
    } = {}) {
        const breaker = new Breaker(host, { maxFailures, onResponse, maxAge, timeout });
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
