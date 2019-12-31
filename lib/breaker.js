'use strict';

const EventEmitter = require('events');
const Metrics = require('@metrics/client');
const assert = require('assert');
const response = require('./response');
const utils = require('./utils');

const stats = Symbol('_stats');

const Breaker = class Breaker extends EventEmitter {
    constructor(host = '', {
        maxFailures = 5, onResponse = response, maxAge = 5000, timeout = 20000,
    } = {}) {
        super();

        assert(host, 'The argument "host" must be provided');
        assert(Number.isInteger(maxFailures), `Provided value, ${maxFailures}, to argument "maxFailures" is not a number`);
        assert(utils.isFunction(onResponse), 'Provided value to argument "onResponse" is not a function');
        assert(Number.isInteger(timeout), `Provided value, ${timeout}, to argument "timeout" is not a number`);
        assert(Number.isInteger(maxAge), `Provided value, ${maxAge}, to argument "maxAge" is not a number`);

        Object.defineProperty(this, 'host', {
            value: host,
            enumerable: true,
        });

        Object.defineProperty(this, 'timeout', {
            value: timeout,
            enumerable: true,
        });

        Object.defineProperty(this, 'onResponse', {
            value: onResponse,
            enumerable: true,
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

        Object.defineProperty(this, 'counter', {
            value: this.metrics.counter({
                name: 'circuitb_state_event',
                description: 'Circuit breaker state',
            }),
        });

        this.on('closed', (hostname) => {
            this[stats]('closed', hostname);
        });

        this.on('half_open', (hostname) => {
            this[stats]('half_open', hostname);
        });

        this.on('open', (hostname) => {
            this[stats]('open', hostname);
        });
    }

    get [Symbol.toStringTag]() {
        return 'Breaker';
    }

    [stats](state, host) {
        this.counter.inc({
            labels: {
                state,
                host,
            },
        });
    }

    check() {
        if (this.state === 'OPEN') {
            const now = Date.now();

            if (now >= this.tripped) {
                this.state = 'HALF_OPEN';
                this.tripped = Date.now() + this.maxAge;
                this.emit('half_open', this.host);
                return false;
            }

            this.emit('open', this.host);
            return true;
        }

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.emit('open', this.host);
            return true;
        }

        this.emit('closed', this.host);
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

        return true;
    }

    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.tripped = -1;
    }
};

module.exports = Breaker;
