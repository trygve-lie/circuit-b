'use strict';

const Breaker = class Breaker {
    constructor(max = 5) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.max = max;
        this.pending = false;
    }

    /**
     * Meta
     */

    get [Symbol.toStringTag]() {
        return 'Breaker';
    }

    check() {
        if (this.state === 'OPEN') {
            if (this.failures === this.max) {
                this.state = 'HALF_OPEN';
                this.failures = 0;
            } else {
                this.failures += 1;
                return true;
            }
        }

        if (this.state === 'HALF_OPEN') {
            if (this.pending) {
                return true;
            }
            this.pending = true;
            return false;
        }

        return false;
    }

    trip() {
        this.state = 'OPEN';
        this.pending = false;
    }

    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.pending = false;
    }
};

module.exports = Breaker;
