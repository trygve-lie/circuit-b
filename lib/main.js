'use strict';

const EventEmitter = require('events');
const BreakerError = require('./error');
const asyncHooks = require('async_hooks');
const Breaker = require('./breaker');
const assert = require('assert');

const CircuitB = class CircuitB extends EventEmitter {
    constructor({ maxFailures = 5, maxAge = 5000 } = {}) {
        super();

        assert(Number.isInteger(maxFailures), `Provided value, ${maxFailures}, to argument "maxFailures" is not a number`);
        assert(Number.isInteger(maxAge), `Provided value, ${maxAge}, to argument "maxAge" is not a number`);

        Object.defineProperty(this, 'registry', {
            value: new Map(),
        });

        Object.defineProperty(this, 'maxAge', {
            value: maxAge,
        });

        Object.defineProperty(this, 'maxFailures', {
            value: maxFailures,
        });

        const hooks = {
            init: (asyncId, type, triggerAsyncId, resource) => {
                if (type === 'TCPWRAP') {
                    process.nextTick(() => {
                        let breaker;

                        // "lookup" happens before net connect, everything after this is
                        // too late to be used to prevent that a net connection is made.
                        resource.owner.once('lookup', (err, address, family, host) => {
                            if (this.registry.has(host)) {
                                breaker = this.registry.get(host);
                                if (breaker.check()) {
                                    resource.owner.destroy(new BreakerError(`Circuit breaker is open for host: ${host}`));
                                }
                            }
                        });

                        resource.owner.once('error', () => {
                            if (breaker) {
                                breaker.trip();
                            }
                        });

                        resource.owner.once('timeout', () => {
                            if (breaker) {
                                breaker.trip();
                            }
                        });

                        resource.owner.once('abort', () => {
                            if (breaker) {
                                breaker.trip();
                            }
                        });

                        resource.owner.once('end', () => {
                            if (breaker) {
                                const code = resource.owner._httpMessage.res.statusCode;
                                if (code >= 400 && code <= 499) {
                                    breaker.trip();
                                    return;
                                }

                                if (code >= 500 && code <= 599) {
                                    breaker.trip();
                                    return;
                                }

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
        this.hook.enable();
    }

    disable() {
        this.hook.disable();
    }

    set(host, { maxFailures = this.maxFailures, maxAge = this.maxAge } = {}) {
        const breaker = new Breaker(host, { maxFailures, maxAge });
        breaker.on('open', (hostname) => {
            this.emit('open', hostname);
        });
        breaker.on('half_open', (hostname) => {
            this.emit('open', hostname);
        });
        breaker.on('close', (hostname) => {
            this.emit('close', hostname);
        });
        this.registry.set(host, breaker);
    }
};

module.exports = CircuitB;
