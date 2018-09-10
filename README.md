# circuit-b

A non intrusive circuit breaker for node.js

[![Dependencies](https://img.shields.io/david/trygve-lie/circuit-b.svg?style=flat-square)](https://david-dm.org/trygve-lie/circuit-b)[![Build Status](http://img.shields.io/travis/trygve-lie/circuit-b/master.svg?style=flat-square)](https://travis-ci.org/trygve-lie/circuit-b)


## Installation

```bash
$ npm install circuit-b
```


## Example

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com');
breaker.set('api.elsewhere.net');

breaker.enable();

// Do http requests with any http lib. The breaker will guard it.
request('http://api.somewhere.com', (error, response, body) => {
    console.log(body);
});
```


## Description

A circuit breaker provides latency and fault protection for distributed systems. A circuit
breaker monitor outgoing requests, and will trip an internal circuit if it begins to detect
that the remote service is failing. By doing so, one can redirect requests to sane fallbacks,
and back-off requests against downstream services so they can recover. This pattern is
described in detail in the [akka documentation](https://doc.akka.io/docs/akka/current/common/circuitbreaker.html).

Circuit-b is non intrusive in the way that one do not need to implement it every single place
one do a http call in an application. One only need to init Circuit-b one place in an application
and it will intercept all http calls. When that is said; one can init Circuit-b multiple times if
wanted.

Under the hood Circuit-b use async hooks to intercept http calls on the net socket level so there
is no altering of the global http object in node or any global singletons.

By using this approach there is a clear separation between the code doing http calls and the
code doing circuit breaking.

Since interaction happen on the net socket, Circuit-b should work out of the box with any node.js
http library. In theory.


## Constructor

Create a new Circuit-b instance.

```js
const Breaker = require('circuit-b');
const breaker = new Breaker(options);
```

### options (optional)

An Object containing misc configuration. The following values can be provided:

 * maxFailures - `Number` - Default number of failures which should occur before the breaker switch into open state. Can be overrided by each host. Default: 5.
 * maxAge - `Number` - Default time in milliseconds from the breaker entered open state until it enters half open state. Can be overrided by each host. Default: 5000ms.


## API

The Circuit-b instance have the following API:

### .set(host, options)

Set a host to be guarded by the breaker.

```js
const breaker = new Breaker();

breaker.set('api.somewhere.com');
breaker.set('api.elsewhere.net', { maxFailures: 10 });
```

This method take the following arguments:

 * host - `String` - The host to guard. Required.
 * options.maxFailures - `Number` - Default number of failures which should occur before the breaker switch into open state. Inherits from constructor if unset.
 * options.maxAge - `Number` - Default time in milliseconds from the breaker entered open state until it enters half open state. Inherits from constructor if unset.


### .del(host)

To be implemented


### .enable()

Enable the breaker to intercept http calls. Under the hood this enables the async hook
which does the interception.

### .disable()

Disables the breaker from intercept http calls. Under the hood this disables the async
hook which does the interception.

### .metrics()

To be implemented


## Events

This module emits the following events:

### close

Emitted when the breaker switches a host to closed state. Callback function is emitted
with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('close', (host) => {
    console.log(host, 'switched to close state');
});
```

### open

Emitted when the breaker switches a host to open state. Callback function is emitted
with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('open', (host) => {
    console.log(host, 'switched to open state');
});
```

### half_open

Emitted when the breaker switches a host to half open state. Callback function is emitted
with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('half_open', (host) => {
    console.log(host, 'switched to half open state');
});
```


## Timeouts

One aspect of monitoring health status of a downstream service is timeouts of the http
calls to the service.

Since circuit-b is non intrusive it does ***not*** time requests by itself to detect
timeouts  but rely on detecting timeout errors on the socket of each host it tracks.
In other words; timeouts is controlled by setting the timeout on the http client in use.

Its also important to remember that many http libraries / and the default http timeout
in node.js are rather high. Its recommended to tune this.

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com');
breaker.set('api.elsewhere.net');

breaker.enable();

// Will timeout after 5 seconds, and trigger breaker
request({
        uri: 'http://api.somewhere.com',
        timeout: 5000
    }, (error, response, body) => {
        console.log(body);
});

// Will timeout after 10 seconds, and trigger breaker
request({
        uri: 'http://api.elsewhere.net',
        timeout: 10000
    }, (error, response, body) => {
        console.log(body);
});
```


## Error handling when circuit breaking

When the circuit breaker are in open state (iow; when the downstream service have issues)
http requests will be terminated with a `CircuitBreakerOpenException` error object.

This error object can be used to choose what one do when a downstream service is
circuit broken.

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com');

breaker.enable();

request({
        uri: 'http://api.somewhere.com',
        timeout: 5000
    }, (error, response, body) => {
        if (error) {
            if (error.name === 'CircuitBreakerOpenException') {
                console.log('Downstream service is curcuit broken');
            } else {
                console.log('Something went humpty dumpty');
            }
            return;
        }
        console.log(body);
});
```


## node.js compabillity

This module use [async hooks](https://nodejs.org/api/async_hooks.html) which was first
introdused in node.js 8.1. Despite that, this module will only work fully with node.js
version 10.x or newer.


## License

The MIT License (MIT)

Copyright (c) 2018 - Trygve Lie - post@trygve-lie.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
