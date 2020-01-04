'use strict';

const { test } = require('tap');
const axios = require('axios');
const { before, after } = require('../utils/utils');
const timeout = require('./integration/timeout');
const http400 = require('./integration/http-status-400');
const http500 = require('./integration/http-status-500');
const errorFlight = require('./integration/error-in-flight');
const customTripper = require('./integration/custom-tripper');

const HOST = 'circuit-b-axios.local';

const client = options => new Promise((resolve) => {
    axios.get(`http://${options.host}:${options.port}/`)
        .then((res) => {
            resolve(res.data);
        })
        .catch((error) => {
            if (error.response) {
                resolve('http error');
            } else if (error.code === 'CircuitBreakerOpenException') {
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
    // WARNING: This mutates the host file permanently
    await before(HOST);
    t.end();
});

test('integration - axios - timeouts', async (t) => {
    const result = await timeout(client, HOST);
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

test('integration - axios - http status 400 errors', async (t) => {
    const result = await http400(client, HOST);
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

test('integration - axios - http status 500 errors', async (t) => {
    const result = await http500(client, HOST);
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

test('integration - axios - error', async (t) => {
    const result = await errorFlight(client, HOST);
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

test('integration - axios - custom tripper', async (t) => {
    const result = await customTripper(client, HOST);
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
