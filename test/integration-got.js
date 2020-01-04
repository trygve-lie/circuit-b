'use strict';

const got = require('got');
const { test } = require('tap');
const { before } = require('../utils/utils');
const timeout = require('./integration/timeout');
const http400 = require('./integration/http-status-400');
const http500 = require('./integration/http-status-500');
const http500Retry = require('./integration/http-status-500-retry');
const errorFlight = require('./integration/error-in-flight');
const errorFlightRetry = require('./integration/error-in-flight-retry');
const customTripper = require('./integration/custom-tripper');

const HOST = 'circuit-b-got.local';

const client = async (options) => {
    const opts = {
        method: 'GET',
        timeout: options.timeout,
        retry: options.retry,
    };

    try {
        const response = await got(`http://${options.host}:${options.port}/`, opts);
        return response.body;
    } catch (error) {
        if (error.response && error.response.statusCode) {
            return 'http error';
        } if (error.code === 'CircuitBreakerOpenException') {
            return 'circuit breaking';
        } if (error.code === 'CircuitBreakerTimeout') {
            return 'timeout';
        } if (error.code === 'ESOCKETTIMEDOUT') {
            return 'timeout';
        }
        return 'error';
    }
};


test('before', async (t) => {
    // WARNING: This mutates the host file permanently
    await before(HOST);
    t.end();
});

test('integration - got - retry: 0 - timeouts', async (t) => {
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

test('integration - got - retry: 0 - http status 400 errors', async (t) => {
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

test('integration - got - retry: 0 - http status 500 errors', async (t) => {
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

test('integration - got - retry: 0 - error', async (t) => {
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

test('integration - got - retry: 0 - custom tripper', async (t) => {
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

test('integration - got - retry: default(2) - http status 500 errors', async (t) => {
    const result = await http500Retry(client, HOST);
    t.deepEqual(result, [
        'ok',
        'ok',
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

test('integration - got - retry: default (2) - error', async (t) => {
    const result = await errorFlightRetry(client, HOST);
    t.deepEqual(result, [
        'ok',
        'ok',
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
