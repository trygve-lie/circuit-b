'use strict';

const { test } = require('tap');
const metrics = require('./integration/metrics');

const HOST = 'circuit-b-metrics.local';

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
