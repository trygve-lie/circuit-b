'use strict';

const EventEmitter = require('events');
const asyncHooks = require('async_hooks');
const BreakerError = require('./error');
const Breaker = require('./breaker');

const CircuitB = class CircuitB extends EventEmitter {
    constructor() {
        super();

        Object.defineProperty(this, 'registry', {
            value: new Map(),
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

    set(host, options) {
        const breaker = new Breaker(host, options);
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
