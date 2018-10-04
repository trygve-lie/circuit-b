'use strict';

const CircuitB = require('../../');
const { server, sleep } = require('../../utils/utils');

const test = async (client) => {
    const cb = new CircuitB({ maxAge: 200, timeout: 100 });
    const s = await server({ type: 'timeout', healAt: 7 });
    const address = s.address();

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const options = {
        host: 'circuit-b.local',
        port: address.port,
    };

    const result = [];

    // two ok responses, server fails at third request. total 2 request to server
    result.push(await client(options));
    result.push(await client(options));

    // four error responses, server failed at third request. total 6 request to server
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));

    // circuit breaker is now terminating requests to server
    result.push(await client(options));
    result.push(await client(options));

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // one error responses. total 7 request to server
    result.push(await client(options));

    // circuit breaker is now terminating requests to server
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // server is healty. circuit breaker should not interfere
    result.push(await client(options));
    result.push(await client(options));

    await s.stop();
    await sleep(20);

    cb.disable();
    return result;
};

module.exports = test;
