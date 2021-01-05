'use strict';

const stream = require('stream');
const http = require('http');

const server = ({ failAt = 3, healAt = 10, type = 'code-500' } = {}) => new Promise((resolve) => {
    let counter = 0;
    const s = http.createServer((req, res) => {
        counter += 1;
        if (counter >= failAt && counter <= healAt) {
            if (type === 'code-400') {
                res.writeHead(429, { 'Content-Type': 'text/plain' });
                res.end('error');
            }
            if (type === 'code-500') {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('error');
            }
            if (type === 'timeout') {
                setTimeout(() => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('ok');
                }, 1000);
            }
            if (type === 'error') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                setTimeout(() => {
                    res.socket.destroy(new Error('Problem'));
                }, 5);
            }
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
    }).listen({ host: '127.0.0.1', port: 0 }, () => {
        resolve(s);
    });

    s.stop = () => new Promise((res) => {
        s.close(res);
    });
});
module.exports.server = server;


const clientHttp = (options) => new Promise((resolve) => {
    const req = http.get(options);

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
        } else {
            resolve('error');
        }
    });

    req.on('timeout', () => {
        resolve('timeout');
        req.destroy();
    });
});
module.exports.clientHttp = clientHttp;

const sleep = time => new Promise((resolve) => {
    setTimeout(() => {
        resolve();
    }, time);
});
module.exports.sleep = sleep;

const within = (value, min = 0, max = 10) => {
    if (min < value && value < max) {
        return true;
    }
    return false;
};
module.exports.within = within;

const DestObjectStream = class DestObjectStream extends stream.Writable {
    constructor(...args) {
        super(Object.assign({
            objectMode: true,
        }, args));

        this.chunks = [];
    }

    _write(chunk, encoding, callback) {
        this.chunks.push(chunk);
        callback();
    }

    result() {
        return new Promise((resolve) => {
            process.nextTick(() => {
                resolve(this.chunks);
            });
        });
    }
};
module.exports.DestObjectStream = DestObjectStream;
