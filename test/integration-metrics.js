'use strict';

const { test } = require('tap');
const {
    before, after,
} = require('../utils/utils');
const metrics = require('./integration/metrics');

const HOST = 'circuit-b-metrics.local';

test('before', async (t) => {
    await before(HOST);
    t.end();
});


/**
 * Metrics
 */

test('integration - metrics', async (t) => {
    const result = await metrics(HOST);
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
    await after(HOST);
    t.end();
});
