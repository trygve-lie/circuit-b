'use strict';

const EventEmitter = require('events');
const assert = require('assert');

const Breaker = class Breaker extends EventEmitter {
    constructor(host = '', { maxFailures = 5, maxAge = 5000 } = {}) {
        super();

        assert(host, `The argument "host" must be provided`);
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
    }

    get [Symbol.toStringTag]() {
        return 'Breaker';
    }

    check() {
        if (this.state === 'OPEN') {
            const now = Date.now();

            if (now >= this.tripped) {
                this.state = 'HALF_OPEN';
                this.emit('half_open', this.host);
                return false;
            }

            return true;
        }

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.tripped = Date.now() + this.maxAge;
            this.emit('open', this.host);
            return true;
        }

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
        this.failures = 0;
        this.tripped = -1;
        this.state = 'CLOSED';
        this.emit('close', this.host);
    }
};

module.exports = Breaker;
