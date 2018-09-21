'use strict';

const CircuitB = require('../../');
const {
    server, clientHttp, sleep, destObjectStream
} = require('./utils');

const test = async () => {
    const cb = new CircuitB({ maxAge: 200, timeout: 100 });
    const s = await server({ type: 'code-500', healAt: 7 });
    const address = s.address();

    const result = new destObjectStream();
    cb.metrics.pipe(result);

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const options = {
        host: 'circuit-b.local',
        port: address.port,
    };

    // two ok responses, server fails at third request. total 2 request to server
    await clientHttp(options);
    await clientHttp(options);

    // four error responses, server failed at third request. total 6 request to server
    await clientHttp(options);
    await clientHttp(options);
    await clientHttp(options);
    await clientHttp(options);

    // circuit breaker is now terminating requests to server
    await clientHttp(options);
    await clientHttp(options);

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // one error responses. total 7 request to server
    await clientHttp(options);

    // circuit breaker is now terminating requests to server
    await clientHttp(options);
    await clientHttp(options);
    await clientHttp(options);
    await clientHttp(options);

    // exceed max time for circuit breaker. let one request to server through
    await sleep(220);

    // server is healty. circuit breaker should not interfere
    await clientHttp(options);
    await clientHttp(options);

    await s.close();

    cb.del('circuit-b.local');
    cb.disable();

    const arr = await result.result();
    return arr.map((obj) => {
        return obj.meta.state;
    });
};

module.exports = test;
