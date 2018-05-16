'use strict';

const Breaker = require('../lib/breaker');
const tap = require('tap');

/**
 * Constructor
 */

tap.test('Breaker() - object type - should be Breaker', (t) => {
    const breaker = new Breaker();
    t.equal(Object.prototype.toString.call(breaker), '[object Breaker]');
    t.end();
});

tap.test('Breaker() - no "max" argument set - should set default "max" to 5', (t) => {
    const breaker = new Breaker();
    t.equal(breaker.max, 5);
    t.end();
});

tap.test('Breaker() - "max" argument set - should set "max" to value', (t) => {
    const breaker = new Breaker(10);
    t.equal(breaker.max, 10);
    t.end();
});


/**
 * .trip()
 */

tap.test('.trip() - breaker is "closed" - should set state to "open" and pending to "false"', (t) => {
    const breaker = new Breaker();
    breaker.trip();

    t.equal(breaker.state, 'OPEN');
    t.false(breaker.pending);
    t.end();
});

tap.test('.trip() - breaker is "open" - should keep state "open" and pending "false"', (t) => {
    const breaker = new Breaker();
    breaker.trip();

    t.equal(breaker.state, 'OPEN');
    t.false(breaker.pending);

    breaker.trip();

    t.equal(breaker.state, 'OPEN');
    t.false(breaker.pending);

    t.end();
});


/**
 * .check()
 */

tap.test('.check() - No alter to default object  - should return "false"', (t) => {
    const breaker = new Breaker();
    const result = breaker.check();

    t.false(result);
    t.end();
});

tap.test('.check() - trip and check less then "max" before reset  - should keep state "open"', (t) => {
    const breaker = new Breaker();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    let result = breaker.check();
    t.false(result);
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    breaker.trip();

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.true(result);

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.true(result);

    result = breaker.check();
    t.equal(breaker.state, 'OPEN');
    t.true(result);

    breaker.reset();

    result = breaker.check();
    t.equal(breaker.state, 'CLOSED');
    t.false(result);

    t.end();
});

tap.test('.check() - trip and check less then "max" before reset  - should switch state to "closed"', (t) => {
    const breaker = new Breaker();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    let result = breaker.check();
    t.false(result);
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 1);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 2);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 3);

    breaker.reset();

    result = breaker.check();
    t.false(result);
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    t.end();
});

tap.test('.check() - trip and check more then "max" before reset  - should switch state to "half_open", then to "closed"', (t) => {
    const breaker = new Breaker();
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    breaker.trip();

    let result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 1);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 2);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 3);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 4);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 5);

    breaker.trip();

    result = breaker.check();
    t.false(result);
    t.true(breaker.pending);
    t.equal(breaker.state, 'HALF_OPEN');
    t.equal(breaker.failures, 0);

    breaker.trip();

    result = breaker.check();
    t.true(result);
    t.equal(breaker.state, 'OPEN');
    t.equal(breaker.failures, 1);

    breaker.reset();

    result = breaker.check();
    t.false(result);
    t.equal(breaker.state, 'CLOSED');
    t.equal(breaker.failures, 0);

    t.end();
});
