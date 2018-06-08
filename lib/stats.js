'use strict';

const Stats = class Stats {
    constructor() {
        Object.defineProperty(this, 'counts', {
            value: new Map(),
        });

        Object.defineProperty(this, 'samples', {
            value: new Map(),
        });
    }

    get [Symbol.toStringTag]() {
        return 'Stats';
    }

    increment(name) {

    }

    decrement(name) {

    }

    sample() {

    }

    resetCounts(name) {
        if (name) {
            this.counts.delete(name);
        }
    }

    resetSamples(name) {
        if (name) {
            this.samples.delete(name);
        }
    }

    reset() {
        this.resetCounts();
        this.resetCounts();
    }
};

module.exports = Stats;
