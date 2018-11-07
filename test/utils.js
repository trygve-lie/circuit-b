'use strict';

const test = require('tape');
const utils = require('../lib/utils');

/**
 * .isFunction()
 */

test('.isFunction() - no arguments given - should return false', (t) => {
    const result = utils.isFunction();
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an object - should return false', (t) => {
    const result = utils.isFunction({});
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an string - should return false', (t) => {
    const result = utils.isFunction('function');
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an array - should return false', (t) => {
    const result = utils.isFunction([]);
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an boolean - should return false', (t) => {
    const result = utils.isFunction(true);
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an number - should return false', (t) => {
    const result = utils.isFunction(42);
    t.false(result);
    t.end();
});

test('.isFunction() - arguments is an function - should return true', (t) => {
    const result = utils.isFunction(() => {});
    t.true(result);
    t.end();
});

test('.isFunction() - arguments is an arrow function - should return true', (t) => {
    const result = utils.isFunction(() => {});
    t.true(result);
    t.end();
});

test('.isFunction() - arguments is an async function - should return true', (t) => {
    const result = utils.isFunction(async () => {});
    t.true(result);
    t.end();
});
