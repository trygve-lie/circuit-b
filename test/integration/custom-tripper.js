'use strict';

const CircuitB = require('../../');
const { server, sleep } = require('../../utils/utils');

const test = async (client, host = 'circuit-b.local') => {
    const cb = new CircuitB({ maxAge: 200, timeout: 100 });
    const s = await server({ type: 'code-400', healAt: 6 });
    const address = s.address();

    cb.set(host, {
        maxFailures: 4,
        onResponse: () => false,
    });
    cb.enable();

    const options = {
        host,
        port: address.port,
        timeout: 2000,
        retry: 0,
    };

    const result = [];

    // two ok responses, server fails at third request. total 2 request to server
    result.push(await client(options));
    result.push(await client(options));

    // four error responses, server failed at third request. circuit breaker is not
    // responding to these because onResponse is set to not trip on http errors
    // total 6 request to server
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));
    result.push(await client(options));

    // circuit breaker is not interfering
    result.push(await client(options));
    result.push(await client(options));

    await s.stop();
    await sleep(20);

    cb.disable();
    cb.del(host);

    return result;
};

module.exports = test;
