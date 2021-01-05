'use strict';

const request = require('request');
const { test } = require('tap');
const timeout = require('./integration/timeout');
const http400 = require('./integration/http-status-400');
const http500 = require('./integration/http-status-500');
const errorFlight = require('./integration/error-in-flight');
const customTripper = require('./integration/custom-tripper');

const HOST = 'circuit-b-request.local';

const client = options => new Promise((resolve) => {
    const opts = {
        method: 'GET',
        timeout: options.timeout,
        url: `http://${options.host}:${options.port}/`,
    };
    const req = request(opts);

    req.on('response', (res) => {
        if (res.statusCode !== 200) {
            resolve('http error');
        }

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            resolve(data);
        });
    });

    req.on('error', (error) => {
        if (error.code === 'CircuitBreakerOpenException') {
            resolve('circuit breaking');
        } else if (error.code === 'CircuitBreakerTimeout') {
            resolve('timeout');
        } else if (error.code === 'ESOCKETTIMEDOUT') {
            resolve('timeout');
        } else {
            resolve('error');
        }
    });
});

test('integration - request.js - timeouts', async (t) => {
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

test('integration - request.js - http status 400 errors', async (t) => {
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

test('integration - request.js - http status 500 errors', async (t) => {
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

test('integration - request.js - error', async (t) => {
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

test('integration - request.js - custom tripper', async (t) => {
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
