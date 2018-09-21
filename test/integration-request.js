'use strict';

const test = require('tape');
const {
    before, clientRequest, after
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
 * request.js
 */

test('integration - request.js - timeouts', async (t) => {
    const result = await timeout(clientRequest);
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

test('integration - request.js - http status 400 errors', async (t) => {
    const result = await http400(clientRequest);
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

test('integration - request.js - http status 500 errors', async (t) => {
    const result = await http500(clientRequest);
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

test('integration - request.js - error', async (t) => {
    const result = await errorFlight(clientRequest);
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
