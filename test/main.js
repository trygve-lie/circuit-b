'use strict';

const CircuitB = require('../');
const hostile = require('hostile');
const lolex = require('lolex');
const http = require('http');
const tap = require('tap');

const mockServer = (failAt = 3, healAt = 10, type = 'code') => {
    return new Promise((resolve, reject) => {
        let counter = 0;
        const server = http.createServer((req, res) => {
            counter += 1;
            if (counter >= failAt && counter <= healAt) {
                if (type === 'code') {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Error');
                }
                if (type === 'timeout') {
                    setTimeout(() => {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('OK');
                    }, 1000);
                }
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        }).listen(() => {
            resolve(server);
        });
    });
};

const request = (address) => {
    return new Promise((resolve, reject) => {
        http.get(address, (res) => {
            if (res.statusCode !== 200) {
                resolve(null);
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            console.log('error', error);
            resolve(error);
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

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const a = await request(`http://circuit-b.local:${address.port}`);
    console.log('a', a);
    const b = await request(`http://circuit-b.local:${address.port}`);
    console.log('b', b);
    const c = await request(`http://circuit-b.local:${address.port}`);
    console.log('c', c);
    const d = await request(`http://circuit-b.local:${address.port}`);
    console.log('d', d);
    const e = await request(`http://circuit-b.local:${address.port}`);
    console.log('e', e);
    const f = await request(`http://circuit-b.local:${address.port}`);
    console.log('f', f);
    const g = await request(`http://circuit-b.local:${address.port}`);
    console.log('g', g);
    const h = await request(`http://circuit-b.local:${address.port}`);
    console.log('h', h);

    server.close(() => {
        t.end();
    });

    //    t.equal(Object.prototype.toString.call(cb), '[object CircuitB]');
});

tap.test('teardown', (t) => {
    hostile.remove('127.0.0.1', 'circuit-b.local', (error) => {
        if (error) {
            throw error;
        }
        t.end();
    });
});
