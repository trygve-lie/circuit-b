'use strict';

const test = require('tape');
const CircuitB = require('../');

/**
 * Constructor
 */

test('CircuitB() - object type - should be CircuitB', (t) => {
    const cb = new CircuitB();
    t.equal(Object.prototype.toString.call(cb), '[object CircuitB]');
    t.end();
});

test('CircuitB() - "maxFailures" argument is not a number - should throw', (t) => {
    t.plan(1);
    t.throws(() => {
        const cb = new CircuitB({ maxFailures: 'foo' }); // eslint-disable-line no-unused-vars
    }, /Provided value, foo, to argument "maxFailures" is not a number/);
    t.end();
});

test('CircuitB() - "maxAge" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB({ maxAge: 'foo' }); // eslint-disable-line no-unused-vars
    }, /Provided value, foo, to argument "maxAge" is not a number/);
    t.end();
});

test('CircuitB() - "timeout" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB({ timeout: 'foo' }); // eslint-disable-line no-unused-vars
    }, /Provided value, foo, to argument "timeout" is not a number/);
    t.end();
});


/**
 * .set()
 */

test('.set() - "host" argument is not set - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set();
    }, /The argument "host" must be provided/);
    t.end();
});

test('.set() - "maxFailures" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set('circuit-b.local', { maxFailures: 'foo' });
    }, /Provided value, foo, to argument "maxFailures" is not a number/);
    t.end();
});

test('.set() - "maxAge" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set('circuit-b.local', { maxAge: 'foo' });
    }, /Provided value, foo, to argument "maxAge" is not a number/);
    t.end();
});

test('.set() - "timeout" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set('circuit-b.local', { timeout: 'foo' });
    }, /Provided value, foo, to argument "timeout" is not a number/);
    t.end();
});


/**
 * .del()
 */

test('.del() - remove existing domain - should return "true"', (t) => {
    const cb = new CircuitB();
    cb.set('circuit-b.local');
    const result = cb.del('circuit-b.local');
    t.ok(result);
    t.end();
});

test('.del() - remove non existing domain - should return "false"', (t) => {
    const cb = new CircuitB();
    const result = cb.del('circuit-b.local');
    t.notOk(result);
    t.end();
});
