'use strict';

const Breaker = class Breaker {
    constructor(maxFailures = 5, maxAge = 5000) {

        Object.defineProperty(this, 'state', {
            value: 'CLOSED',
            writable: true,
        });

        Object.defineProperty(this, 'tripped', {
            value: -1,
            writable: true,
        });

        Object.defineProperty(this, 'maxAge', {
            value: maxAge,
            writable: true,
        });

        Object.defineProperty(this, 'maxFailures', {
            value: maxFailures,
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
                return false;
            }

            return true;
        }

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.tripped = Date.now() + this.maxAge;
            return true;
        }

        return false;
    }

    trip() {
        this.failures += 1;

        if (this.failures >= this.maxFailures) {
            this.state = 'OPEN';
        }

        if (this.failures === this.maxFailures) {
            this.tripped = Date.now() + this.maxAge;
        }
    }

    reset() {
        this.failures = 0;
        this.tripped = -1;
        this.state = 'CLOSED';
    }
};

module.exports = Breaker;
