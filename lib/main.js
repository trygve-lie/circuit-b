'use strict';

const asyncHooks = require('async_hooks');


const CircuitB = class CircuitB {
    constructor({} = {}) {
        this.registry = new Map();

        const hooks = {
            init: (asyncId, type, triggerAsyncId, resource) => {
                if (type === 'TCPWRAP') {
                    process.nextTick(() => {
                        // Happens before connect
                        resource.owner.once('lookup', (err, address, family, host) => {
                            console.log('tcp lookup', address, family, host);
                            console.log(resource.owner.address());
                            resource.owner.destroy();
                        });
                        resource.owner.once('connect', () => {
                            // resource.owner
                            console.log('tcp connect');
                            console.log(resource.owner.address());
                        });
                        resource.owner.once('error', () => {
                            // resource.owner
                            console.log('tcp error');
                        });
                        resource.owner.once('timeout', () => {
                            // resource.owner
                            console.log('tcp timeout');
                        });
                        resource.owner.once('abort', () => {
                            // resource.owner
                            console.log('tcp abort');
                        });
                        resource.owner.once('end', () => {
                            // resource.owner
                            console.log('tcp end');
                        });
                    });
                }
            },
        };

        this.hook = asyncHooks.createHook(hooks);

        // asyncHook being defined in code snippet above
    }

    /**
     * Meta
     */

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
