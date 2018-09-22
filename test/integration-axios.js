'use strict';

const test = require('tape');
const {
    before, clientAxios, after
} = require('./integration/utils');
const timeout = require('./integration/timeout');
const http400 = require('./integration/http-status-400');
const http500 = require('./integration/http-status-500');
const errorFlight = require('./integration/error-in-flight');

test('before', async (t) => {
    await before();
    t.end();
});

/**
 * node-fetch
 */
test('integration - node-fetch - timeouts', async (t) => {
    const result = await timeout(clientAxios);
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

test('integration - node-fetch - http status 400 errors', async (t) => {
    const result = await http400(clientAxios);
    t.deepEqual(result, [
        'ok',
        'ok',
        'http error',
        'http error',
        'http error',
        'http error',
        'circuit breaking',
        'circuit breaking',
        'http error',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'ok',
        'ok'
    ]);
    t.end();
});

test('integration - node-fetch - http status 500 errors', async (t) => {
    const result = await http500(clientAxios);
    t.deepEqual(result, [
        'ok',
        'ok',
        'http error',
        'http error',
        'http error',
        'http error',
        'circuit breaking',
        'circuit breaking',
        'http error',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'circuit breaking',
        'ok',
        'ok'
    ]);
    t.end();
});

test('integration - node-fetch - error', async (t) => {
    const result = await errorFlight(clientAxios);
    t.deepEqual(result, [
        'ok',
        'ok',
        'error',
        'error',
        'error',
        'error',
        'circuit breaking',
        'circuit breaking',
        'error',
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
