'use strict';

const CircuitB = require('../../');
const { server, sleep } = require('../../utils/utils');

const test = async (client, host = 'circuit-b.local') => {
    const cb = new CircuitB({ maxAge: 200, timeout: 100 });
    const s = await server({ type: 'timeout', healAt: 7 });
    const address = s.address();

    cb.set(host, { maxFailures: 4 });
    cb.enable();

    const times = [];
    const start = Date.now();

    const options = {
        host,
        port: address.port,
        timeout: 2000,
        retry: 0,
    };

    const result = [];

    // two ok responses, server fails at third request. total 2 request to server
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);

    // four error responses, server failed at third request. total 6 request to server
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);

    // circuit breaker is now terminating requests to server
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // one error responses. total 7 request to server
    result.push(await client(options));
    times.push(Date.now() - start);

    // circuit breaker is now terminating requests to server
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);
    times.push(Date.now() - start);

    // server is healty. circuit breaker should not interfere
    result.push(await client(options));
    times.push(Date.now() - start);
    result.push(await client(options));
    times.push(Date.now() - start);

    await s.stop();
    await sleep(20);
    times.push(Date.now() - start);

    console.log(host, times);

    cb.disable();
    return result;
};

module.exports = test;
