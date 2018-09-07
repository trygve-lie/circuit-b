'use strict';

const CircuitB = require('../');
const test = require('tape');


/*
test('setup', (t) => {
    hostile.set('127.0.0.1', 'circuit-b.local', (error) => {
        if (error) {
            throw error;
        }
        t.end();
    });
});
*/

/**
 * Constructor
 */

test('CircuitB() - object type - should be CircuitB', (t) => {
    const cb = new CircuitB();
    t.equal(Object.prototype.toString.call(cb), '[object CircuitB]');
    t.end();
});

test('CircuitB() - "maxFailures" argument is not a number - should throw', (t) => {
    t.plan(1);
    t.throws(() => {
        const cb = new CircuitB({ maxFailures: 'foo' });
    }, /Provided value, foo, to argument "maxFailures" is not a number/);
    t.end();
});

test('CircuitB() - "maxAge" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB({ maxAge: 'foo' });
    }, /Provided value, foo, to argument "maxAge" is not a number/);

    t.end();
});


/**
 * .set()
 */

test('.set() - "host" argument is not set - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set();
    }, /The argument "host" must be provided/);

    t.end();
});

test('.set() - "maxFailures" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set('circuit-b.local', { maxFailures: 'foo' });
    }, /Provided value, foo, to argument "maxFailures" is not a number/);

    t.end();
});

test('.set() - "maxAge" argument is not a number - should throw', (t) => {
    t.throws(() => {
        const cb = new CircuitB();
        cb.set('circuit-b.local', { maxAge: 'foo' });
    }, /Provided value, foo, to argument "maxAge" is not a number/);

    t.end();
});

/*
test('CircuitB() - downstream server errors with http 400 error codes - should circuit break according to pattern', async (t) => {
    const clock = lolex.install();

    const cb = new CircuitB();
    const server = await mockServer({ type: 'code-400', healAt: 7 });
    const address = server.address();

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const options = {
        host: 'circuit-b.local',
        port: address.port,
    };

    // two ok responses, server fails at third request. total 2 request to server
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');

    // four error responses, server failed at third request. total 6 request to server
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));

    // circuit breaker is now terminating requests to server
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));

    // exceed max time for circuit breaker. let one request to server through
    clock.tick(6000);

    // one error responses. total 7 request to server
    await t.rejects(request(options), new Error('Status error'));

    // circuit breaker is now terminating requests to server
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));

    // exceed max time for circuit breaker. let one request to server through
    clock.tick(6000);

    // server is healty. circuit breaker should not interfere
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');

    await server.close();

    clock.uninstall();
    t.end();
});

test('CircuitB() - downstream server errors with http 500 error codes - should circuit break according to pattern', async (t) => {
    const clock = lolex.install();

    const cb = new CircuitB();
    const server = await mockServer({ type: 'code-500', healAt: 7 });
    const address = server.address();

    cb.set('circuit-b.local', { maxFailures: 4 });
    cb.enable();

    const options = {
        host: 'circuit-b.local',
        port: address.port,
    };

    // two ok responses, server fails at third request. total 2 request to server
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');

    // four error responses, server failed at third request. total 6 request to server
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));
    await t.rejects(request(options), new Error('Status error'));

    // circuit breaker is now terminating requests to server
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));

    // exceed max time for circuit breaker. let one request to server through
    clock.tick(6000);

    // one error responses. total 7 request to server
    await t.rejects(request(options), new Error('Status error'));

    // circuit breaker is now terminating requests to server
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));
    await t.rejects(request(options), new BreakerError('Circuit breaker is open for host: circuit-b.local'));

    // exceed max time for circuit breaker. let one request to server through
    clock.tick(6000);

    // server is healty. circuit breaker should not interfere
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');
    await t.resolveMatch(request(options), 'ok');

    await server.close();

    clock.uninstall();
    t.end();
});

test('teardown', (t) => {
    hostile.remove('127.0.0.1', 'circuit-b.local', (error) => {
        if (error) {
            throw error;
        }
        t.end();
    });
});
*/

