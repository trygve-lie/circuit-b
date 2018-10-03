'use strict';

const test = require('tape');
const {
    before, after,
} = require('./integration/utils');
const metrics = require('./integration/metrics');

test('before', async (t) => {
    await before();
    t.end();
});


/**
 * Metrics
 */

test('integration - metrics', async (t) => {
    const result = await metrics();
    t.deepEqual(result, [
        'closed',
        'closed',
        'closed',
        'closed',
        'closed',
        'closed',
        'open',
        'open',
        'half_open',
        'open',
        'open',
        'open',
        'open',
        'half_open',
        'closed',
    ]);
    t.end();
});


test('after', async (t) => {
    await after();
    t.end();
});
