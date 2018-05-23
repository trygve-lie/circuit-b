'use strict';

const asyncHooks = require('async_hooks');
const Breaker = require('./breaker');

const CircuitB = class CircuitB {
    constructor({} = {}) {

        Object.defineProperty(this, 'registry', {
            value: new Map(),
        });

        const hooks = {
            init: (asyncId, type, triggerAsyncId, resource) => {
                if (type === 'TCPWRAP') {
                    process.nextTick(() => {

                        let breaker;

                        // Happens before connect
                        resource.owner.once('lookup', (err, address, family, host) => {
                            if (!this.registry.has(host)) {
                                breaker = new Breaker(host);
                                this.registry.set(host, breaker);
                            } else {
                                breaker = this.registry.get(host);
                            }

                            if (breaker.check()) {
                                // Error type should be: CircuitBreakerOpenException
                                resource.owner.destroy(new Error('CircuitBreakerOpenException'));
                            }
                        });

                        resource.owner.once('connect', () => {
                            // resource.owner
                            console.log('tcp connect');
                        });

                        resource.owner.once('error', () => {
                            // resource.owner
                            console.log('tcp error');
                            breaker.trip();
                        });

                        resource.owner.once('timeout', () => {
                            // resource.owner
                            console.log('tcp timeout');
                            breaker.trip();
                        });

                        resource.owner.once('abort', () => {
                            // resource.owner
                            console.log('tcp abort');
                            breaker.trip();
                        });

                        resource.owner.once('end', () => {
                            // resource.owner
                            console.log('tcp end');
                            breaker.reset();
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
};

module.exports = CircuitB;
