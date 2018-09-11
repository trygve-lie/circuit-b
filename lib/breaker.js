'use strict';

const EventEmitter = require('events');
const Metrics = require('@metrics/client');
const assert = require('assert');

const Breaker = class Breaker extends EventEmitter {
    constructor(host = '', { maxFailures = 5, maxAge = 5000 } = {}) {
        super();

        assert(host, 'The argument "host" must be provided');
        assert(Number.isInteger(maxFailures), `Provided value, ${maxFailures}, to argument "maxFailures" is not a number`);
        assert(Number.isInteger(maxAge), `Provided value, ${maxAge}, to argument "maxAge" is not a number`);

        Object.defineProperty(this, 'host', {
            value: host,
        });

        Object.defineProperty(this, 'maxAge', {
            value: maxAge,
        });

        Object.defineProperty(this, 'maxFailures', {
            value: maxFailures,
        });

        Object.defineProperty(this, 'state', {
            value: 'CLOSED',
            writable: true,
        });

        Object.defineProperty(this, 'tripped', {
            value: -1,
            writable: true,
        });

        Object.defineProperty(this, 'failures', {
            value: 0,
            writable: true,
        });

        Object.defineProperty(this, 'metrics', {
            enumerable: true,
            value: new Metrics(),
        });
    }

    get [Symbol.toStringTag]() {
        return 'Breaker';
    }

    stat(state) {
        this.metrics.metric({
            name: 'circuit-b:state:event',
            description: 'Circuit breaker state',
            meta: {
                state: state,
                host: this.host,
            }
        });
    }

    check() {
        if (this.state === 'OPEN') {
            const now = Date.now();

            if (now >= this.tripped) {
                this.state = 'HALF_OPEN';
                this.tripped = Date.now() + this.maxAge;
                this.emit('half_open', this.host);
                this.stat(this.state);
                return false;
            }

            this.stat(this.state);
            return true;
        }

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.stat(this.state);
            this.emit('open', this.host);
            return true;
        }

        this.stat(this.state);
        return false;
    }

    trip() {
        this.failures += 1;

        if (this.failures >= this.maxFailures) {
            this.state = 'OPEN';
            this.emit('open', this.host);
        }

        if (this.failures === this.maxFailures) {
            this.tripped = Date.now() + this.maxAge;
        }
    }

    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.tripped = -1;
        this.emit('close', this.host);
    }
};

module.exports = Breaker;
