'use strict';

const { before, after } = require('./integration/utils');
const test = require('tape');

const timeout = require('./integration/timeout');

test('before', async (t) => {
    await before();
    t.end();
});

test('timing test', async (t) => {
    const result = await timeout();
    t.deepEqual(result, [
        'ok',
        'ok',
        'timeout',
        'timeout',
        'timeout',
        'timeout',
        'circuit breaking',
        'circuit breaking',
        'timeout',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'ok',
        'ok'
    ]);
    t.end();
});

test('after', async (t) => {
    await after();
    t.end();
});
