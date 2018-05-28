'use strict';

const asyncHooks = require('async_hooks');
const Breaker = require('./breaker');

const CircuitB = class CircuitB {
    constructor() {

        Object.defineProperty(this, 'registry', {
            value: new Map(),
        });

        const hooks = {
            init: (asyncId, type, triggerAsyncId, resource) => {
                if (type === 'TCPWRAP') {
                    process.nextTick(() => {

                        let breaker = undefined;

                        // Happens before connect
                        resource.owner.once('lookup', (err, address, family, host) => {
                            if (this.registry.has(host)) {
                                breaker = this.registry.get(host);

                                if (breaker.check()) {
                                    // Error type should be: CircuitBreakerOpenException
                                    resource.owner.destroy(new Error('CircuitBreakerOpenException'));
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
                                // TODO: Support redirects etc...
                                if (resource.owner._httpMessage.res.statusCode === 200) {
                                    breaker.reset();
                                } else {
                                    breaker.trip();
                                }
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

    set(host, config) {
        const breaker = new Breaker(host, config);
        this.registry.set(host, breaker);
    }
};

module.exports = CircuitB;
