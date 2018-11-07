'use strict';

const fetch = require('node-fetch');
const test = require('tape');
const { before, after } = require('../utils/utils');
const timeout = require('./integration/timeout');
const http400 = require('./integration/http-status-400');
const http500 = require('./integration/http-status-500');
const errorFlight = require('./integration/error-in-flight');
const customTripper = require('./integration/custom-tripper');

const client = options => new Promise((resolve) => {
    fetch(`http://${options.host}:${options.port}/`)
        .then((res) => {
            if (res.status !== 200) {
                resolve('http error');
            } else {
                resolve(res.text());
            }
        })
        .catch((error) => {
            if (error.code === 'CircuitBreakerOpenException') {
                resolve('circuit breaking');
            } else if (error.code === 'CircuitBreakerTimeout') {
                resolve('timeout');
            } else if (error.type === 'request-timeout') {
                resolve('timeout');
            } else {
                resolve('error');
            }
        });
});

test('before', async (t) => {
    await before();
    t.end();
});

test('integration - node-fetch - timeouts', async (t) => {
    const result = await timeout(client);
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
        'ok',
    ]);
    t.end();
});

test('integration - node-fetch - http status 400 errors', async (t) => {
    const result = await http400(client);
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
        'ok',
    ]);
    t.end();
});

test('integration - node-fetch - http status 500 errors', async (t) => {
    const result = await http500(client);
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
        'ok',
    ]);
    t.end();
});

test('integration - node-fetch - error', async (t) => {
    const result = await errorFlight(client);
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
        'ok',
    ]);
    t.end();
});

test('integration - node-fetch - custom tripper', async (t) => {
    const result = await customTripper(client);
    t.deepEqual(result, [
        'ok',
        'ok',
        'http error',
        'http error',
        'http error',
        'http error',
        'ok',
        'ok',
    ]);
    t.end();
});

test('after', async (t) => {
    await after();
    t.end();
});
