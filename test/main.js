'use strict';

const hostile = require('hostile');
const lolex = require('lolex');
const http = require('http');
const tap = require('tap');
const CircuitB = require('../');
const BreakerError = require('../lib/error');

const mockServer = (failAt = 3, healAt = 10, type = 'code') => {
    return new Promise((resolve, reject) => {
        let counter = 0;
        const server = http.createServer((req, res) => {
            counter += 1;
            if (counter >= failAt && counter <= healAt) {
                if (type === 'code') {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('error');
                }
                if (type === 'timeout') {
                    setTimeout(() => {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('ok');
                    }, 1000);
                }
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        }).listen(() => {
            resolve(server);
        });
    });
};

const request = (address) => {
    return new Promise((resolve, reject) => {
        http.get(address, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error('Status error'));
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};


tap.test('setup', (t) => {
    hostile.set('127.0.0.1', 'circuit-b.local', (error) => {
        if (error) {
            throw error;
        }
        t.end();
    });
});


/**
 * Constructor
 */

tap.test('CircuitB() - object type - should be CircuitB', (t) => {
    const cb = new CircuitB();
    t.equal(Object.prototype.toString.call(cb), '[object CircuitB]');
    t.end();
});


tap.test('CircuitB() - foo - bar', async (t) => {
    const cb = new CircuitB();
    const server = await mockServer();
    const address = server.address();
    const result = [];

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    await t.resolveMatch(request(`http://circuit-b.local:${address.port}`), 'ok');
    await t.resolveMatch(request(`http://circuit-b.local:${address.port}`), 'ok');

    await t.rejects(request(`http://circuit-b.local:${address.port}`), new Error('Status error'));
    await t.rejects(request(`http://circuit-b.local:${address.port}`), new Error('Status error'));
    await t.rejects(request(`http://circuit-b.local:${address.port}`), new Error('Status error'));
    await t.rejects(request(`http://circuit-b.local:${address.port}`), new Error('Status error'));

    await t.rejects(request(`http://circuit-b.local:${address.port}`), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(`http://circuit-b.local:${address.port}`), new BreakerError('Circuit breaker is open for host: circuit-b.local'));

    server.close(() => {
        t.end();
    });
});

tap.test('teardown', (t) => {
    hostile.remove('127.0.0.1', 'circuit-b.local', (error) => {
        if (error) {
            throw error;
        }
        t.end();
    });
});
