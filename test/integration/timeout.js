'use strict';

const CircuitB = require('../../');
const { server, request, sleep } = require('./utils');

const test = async () => {
    const cb = new CircuitB({ maxAge: 100 });
    const s = await server({ type: 'timeout', healAt: 7 });
    const address = s.address();

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const options = {
        timeout: 20,
        host: 'circuit-b.local',
        port: address.port,
    };

    const result = [];

    // two ok responses, server fails at third request. total 2 request to server
    result.push(await request(options));
    result.push(await request(options));

    // four error responses, server failed at third request. total 6 request to server
    result.push(await request(options));
    result.push(await request(options));
    result.push(await request(options));
    result.push(await request(options));

    // circuit breaker is now terminating requests to server
    result.push(await request(options));
    result.push(await request(options));

    // exceed max time for circuit breaker. let one request to server through
    await sleep(120);

    // one error responses. total 7 request to server
    result.push(await request(options));

    // circuit breaker is now terminating requests to server
    result.push(await request(options));
    result.push(await request(options));
    result.push(await request(options));
    result.push(await request(options));

    // exceed max time for circuit breaker. let one request to server through
    await sleep(120);

    // server is healty. circuit breaker should not interfere
    result.push(await request(options));
    result.push(await request(options));

    await s.close();

    cb.disable();
    return result;
}

module.exports = test;
