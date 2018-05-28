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
request('api.somewhere.com', (error, response, body) => {
    console.log(body);
});
```


## Description

A circuit breaker provides latency and fault protection for distributed systems. A circuit
breaker monitor outgoing requests, and will trip an internal circuit if it begins to detect
that the remote service is failing. By doing so, one can redirect requests to sane fallbacks,
and back-off requests against downstream services so they can recover. This pattern is
described in detail in the [akka documentation](https://doc.akka.io/docs/akka/snapshot/common/circuitbreaker.html).

Circuit-b is non intrusive in the way that one do not need to implement it every single place
one do a http call in an app. One only need to init Circuit-b one place in an application and
it will intercept all http calls in this app. When that is said; one can init Circuit-b
multiple times if wanted.

Under the hood Circuit-b use async hooks to intercept http calls so there is no altering of
the global http object in node or any global singletons.

By using this approach there is a clear separation between the code doing http calls and the
code doing circuit breaking.


## Constructor

Create a new Circuit-b instance.

```js
const Breaker = require('circuit-b');
const breaker = new Breaker(options);
```

### options (optional)

An Object containing misc configuration. The following values can be provided:

 * maxFailures - `Number` - Default number of failures which should occur before the breaker switch into open state. Default: 5.
 * maxAge - `Number` - Default time in milliseconds from the breaker entered open state until it enters half open state. Default: 5000ms.


## API

The Circuit-b instance have the following API:

### .set(host, options)


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
