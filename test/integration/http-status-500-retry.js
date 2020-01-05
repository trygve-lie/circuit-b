'use strict';

const CircuitB = require('../../');
const { server, sleep } = require('../../utils/utils');

const test = async (client, host = 'circuit-b.local') => {
    const cb = new CircuitB({ maxAge: 200, timeout: 100 });
    const s = await server({ type: 'code-500', healAt: 11 });
    const address = s.address();

    cb.set(host, { maxFailures: 4 });
    cb.enable();

    const options = {
        host,
        port: address.port,
        timeout: 2000,
    };

    const result = [];

    // two ok responses, server fails at third request. total 2 request to server
    result.push(await client(options));
    result.push(await client(options));

    // two error responses which is a total of 6 requests to server,
    // server failed at third request. total 8 request to server
    result.push(await client(options));
    result.push(await client(options));

    // circuit breaker is now terminating requests to server
    result.push(await client(options));
    result.push(await client(options));

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // one error responses which is a total of 3 requests to server. total 11 request to server
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
    cb.del(host);

    return result;
};

module.exports = test;
