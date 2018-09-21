'use strict';

const request = require('request');
const hostile = require('hostile');
const stream = require('stream');
const fetch = require('node-fetch');
const http = require('http');

const server = ({ failAt = 3, healAt = 10, type = 'code-500' } = {}) => {
    return new Promise((resolve) => {
        let counter = 0;
        const s = http.createServer((req, res) => {
            counter += 1;
            if (counter >= failAt && counter <= healAt) {
                if (type === 'code-400') {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
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
    });
};
module.exports.server = server;


const clientHttp = (options) => {
    return new Promise((resolve) => {
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
};
module.exports.clientHttp = clientHttp;


const clientRequest = (options) => {
    return new Promise((resolve) => {
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
};
module.exports.clientRequest = clientRequest;


const clientFetch = (options) => {
    return new Promise((resolve) => {
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
};
module.exports.clientFetch = clientFetch;



const sleep = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};
module.exports.sleep = sleep;


const within = (value, min = 0, max = 10) => {
    if (min < value && value < max) {
        return true;
    }
    return false;
};
module.exports.within = within;


const before = () => {
    return new Promise((resolve, reject) => {
        hostile.set('127.0.0.1', 'circuit-b.local', (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
};
module.exports.before = before;


const after = () => {
    return new Promise((resolve, reject) => {
        hostile.remove('127.0.0.1', 'circuit-b.local', (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
};
module.exports.after = after;


const destObjectStream = class destObjectStream extends stream.Writable {
    constructor(...args) {
        super(Object.assign({
            objectMode: true
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
module.exports.destObjectStream = destObjectStream;
