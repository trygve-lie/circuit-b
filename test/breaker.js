'use strict';

const Breaker = require('../lib/breaker');
const lolex = require('lolex');
const test = require('tape');

/**
 * Constructor
 */

test('Breaker() - object type - should be Breaker', (t) => {
    const breaker = new Breaker('circuit-b.local');
    t.equal(Object.prototype.toString.call(breaker), '[object Breaker]');
    t.end();
});

test('Breaker() - no "maxFailures" argument set - should set default "maxFailures" to 5', (t) => {
    const breaker = new Breaker('circuit-b.local');
    t.equal(breaker.maxFailures, 5);
    t.end();
});

test('Breaker() - "maxFailures" argument set - should set "maxFailures" to value', (t) => {
    const breaker = new Breaker('circuit-b.local', { maxFailures: 10 });
    t.equal(breaker.maxFailures, 10);
    t.end();
});

test('Breaker() - no "maxAge" argument set - should set default "maxAge" to 5000', (t) => {
    const breaker = new Breaker('circuit-b.local');
    t.equal(breaker.maxAge, 5000);
    t.end();
});

test('Breaker() - "maxAge" argument set - should set "maxAge" to value', (t) => {
    const breaker = new Breaker('circuit-b.local', { maxAge: 10000 });
    t.equal(breaker.maxAge, 10000);
    t.end();
});

test('Breaker() - "host" argument is not set - should throw', (t) => {
    t.throws(() => {
        const breaker = new Breaker();
    }, new Error('The argument "host" must be provided'));

    t.end();
});

test('Breaker() - "maxFailures" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const breaker = new Breaker('circuit-b.local', { maxFailures: 'foo' });
    }, new Error('Provided value, foo, to argument "maxFailures" is not a number'));

    t.end();
});

test('Breaker() - "maxAge" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const breaker = new Breaker('circuit-b.local', { maxAge: 'foo' });
    }, new Error('Provided value, foo, to argument "maxAge" is not a number'));

    t.end();
});


/**
 * .trip()
 */

test('.trip() - breaker is "closed" - should count failures', (t) => {
    const breaker = new Breaker('circuit-b.local');
    t.equal(breaker.failures, 0);

    breaker.trip();
    t.equal(breaker.failures, 1);

    breaker.trip();
    t.equal(breaker.failures, 2);

    t.end();
});

test('.trip() - breaker is "closed" - reaches max failures - should switch breaker to "open"', (t) => {
    const breaker = new Breaker('circuit-b.local');
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    t.equal(breaker.state, 'OPEN');

    t.end();
});

test('.trip() - breaker is "closed" - reaches max failures - should set "tripped" to now + waitTreshold', (t) => {
    const clock = lolex.install();
    clock.tick(1000);

    const breaker = new Breaker('circuit-b.local');
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    t.equal(breaker.tripped, 6000);

    clock.uninstall();
    t.end();
});


/**
 * .check()
 */

test('.check() - No alter to default object  - should return "false"', (t) => {
    const breaker = new Breaker('circuit-b.local');
    const result = breaker.check();

    t.false(result);
    t.end();
});

test('.check() - trip and check less then "max" before reset  - should return "false" and keep state "closed"', (t) => {
    const breaker = new Breaker('circuit-b.local');

    let result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 1);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 2);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 3);
    t.false(result);

    breaker.reset();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);
    t.false(result);

    t.end();
});

test('.check() - trip and check more then "max" before reset  - should return "true" and switch state to "open"', (t) => {
    const breaker = new Breaker('circuit-b.local');

    let result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 1);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 2);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 3);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 4);
    t.false(result);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 5);
    t.true(result);

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 5);
    t.true(result);

    breaker.reset();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);
    t.false(result);

    t.end();
});

test('.check() - "maxTreshold" is reached - should return "false" on first check, "true" on second check', (t) => {
    const clock = lolex.install();
    clock.tick();

    const breaker = new Breaker('circuit-b.local');

    let result = breaker.check();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();
    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.tripped, 5000);
    t.true(result);

    clock.tick(10000);

    result = breaker.check();
    t.equal(breaker.state, 'HALF_OPEN');
    t.equal(breaker.tripped, 15000);
    t.false(result);

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.tripped, 15000);
    t.true(result);

    breaker.reset();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);
    t.equal(breaker.tripped, -1);
    t.false(result);

    clock.uninstall();
    t.end();
});
