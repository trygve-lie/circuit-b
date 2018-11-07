'use strict';

const test = require('tape');
const response = require('../lib/response');

test('response() - no "res" argument - should return "true"', (t) => {
    const result = response();
    t.true(result);
    t.end();
});

test('response() - "res" has no ".statusCode" parameter - should return "true"', (t) => {
    const result = response({ foo: 'bar' });
    t.true(result);
    t.end();
});

test('response() - "res" has ".statusCode" parameter - should return "true" on 408, 413, 429, 500, 502, 503 and 504', (t) => {
    const result = [];
    for (let i = 100; i < 600; i += 1) {
        if (response({ statusCode: i })) {
            result.push(i);
        }
    }

    t.deepEqual(result, [
        408,
        413,
        429,
        500,
        502,
        503,
        504,
    ]);

    t.end();
});
