# circuit-b

A non intrusive circuit breaker for node.js

[![Dependencies](https://img.shields.io/david/trygve-lie/circuit-b.svg?style=flat-square)](https://david-dm.org/trygve-lie/circuit-b)
[![Build Status](http://img.shields.io/travis/trygve-lie/circuit-b/master.svg?style=flat-square)](https://travis-ci.org/trygve-lie/circuit-b)
[![Greenkeeper badge](https://badges.greenkeeper.io/trygve-lie/circuit-b.svg?style=flat-square)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/trygve-lie/circuit-b/badge.svg?targetFile=package.json&style=flat-square)](https://snyk.io/test/github/trygve-lie/circuit-b?targetFile=package.json)


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

Under the hood Circuit-b use [async hooks](https://nodejs.org/api/async_hooks.html) to intercept
http calls on the net socket level so there is no altering of the global http object in node or
any global singletons.

By using this approach there is a clear separation between the code doing http calls and the
code doing circuit breaking.

Since interaction happen on the net socket, Circuit-b should, in theory, work out of the box with
any node.js http request library. Circuit-b is currently tested to be working with:

 * Native node.js [http.request()](https://nodejs.org/api/http.html#http_http_request_options_callback)
 * [request.js](https://github.com/request/request)
 * [node-fetch](https://github.com/bitinn/node-fetch)
 * [axios](https://github.com/axios/axios)
 * [got](https://github.com/sindresorhus/got) - [[note](https://github.com/trygve-lie/circuit-b#clients-with-retries)]


## Constructor

Create a new Circuit-b instance.

```js
const Breaker = require('circuit-b');
const breaker = new Breaker(options);
```

### options (optional)

An Object containing misc configuration. The following values can be provided:

 * **maxFailures** - `Number` - Default number of failures which should occur before the breaker switch into open state. Can be overrided by each host. Default: 5.
 * **maxAge** - `Number` - Default time in milliseconds from the breaker entered open state until it enters half open state. Can be overrided by each host. Default: 5000ms.
 * **timeout** - `Number` - Default request timeout in milliseconds. Can be overrided by each host. Default: 20000ms.
 * **onResponse** - `Function` - Default function execute on a http response to tripp the breaker. Default trips the breaker on http status codes: `408`, `413`, `429`, `500`, `502`, `503`, `504`.


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

 * **host** - `String` - The host to guard. Required.
 * **options.maxFailures** - `Number` - Number of failures which should occur before the breaker switch into open state. Inherits from constructor if unset.
 * **options.maxAge** - `Number` - Time in milliseconds from the breaker entered open state until it enters half open state. Inherits from constructor if unset.
 * **options.timeout** - `Number` - Request timeout in milliseconds. Inherits from constructor if unset.
 * **options.onResponse** - `Function` - Function to be execute on a http response to tripp the breaker. Inherits from constructor if unset.

### .del(host)

Removes a host from being guarded by the breaker.

```js
const breaker = new Breaker();

breaker.del('api.somewhere.com');
```

This method take the following arguments:

 * **host** - `String` - The host to remove. Required.

Returns `true` if the host was successfully removed and `false` if not.

### .enable()

Enable the breaker to intercept http calls. Under the hood this enables the async hook
which does the interception.

### .disable()

Disables the breaker from intercept http calls. Under the hood this disables the async
hook which does the interception.

### .metrics

Attribute which holds a [metrics stream](https://github.com/metrics-js/client) that
emits metrics data.

The stream will emit an event of the following character for each request the circuit
breaker intercepts:

```js
{
    name: 'circuit-b:state:event',
    description: 'Circuit breaker state',
    timestamp: 1536656326.872,
    value: null,
    time: null,
    meta: {
        state: 'closed',
        host: 'registered.host.io'
    }
}
```

Please see [@metrics/client](https://github.com/metrics-js/client) for examples
of consuming these metrics into your favorite monitoring system.


## Events

For each request the circuit breaker will emit one of the following events:

### closed

Emitted when a request encounters the breaker to be in a closed state. Callback function
is emitted with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('closed', (host) => {
    console.log(host, 'closed state');
});
```

### open

Emitted when a request encounters the breaker to be in a open state. Callback function
is emitted with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('open', (host) => {
    console.log(host, 'open state');
});
```

### half_open

Emitted when a request encounters the breaker to be in a half open state. Callback function
is emitted with `host` as the first argument.

```js
const breaker = new Breaker();
breaker.on('half_open', (host) => {
    console.log(host, 'half open state');
});
```


## HTTP Responses

A struggeling downstream service can despite that respond to http requests. Due to this
Circuit-b does monitor the http statuses on requests and trip the breaker on sertain
status codes.

The breaker will trip when the following http status codes occure in a downstream service:

 * `408` - [Request Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408)
 * `413` - [Payload Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413)
 * `429` - [Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
 * `500` - [Internal Server Error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500)
 * `502` - [Bade Gateway](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502)
 * `503` - [Service Unavailable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503)
 * `504` - [Gateway Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504)


### Custom tripper on HTTP responses

It is possible to provide a custom tripper for HTTP responses by providing a function to
the `onResponse` options on the `constructor` (globally) or the `.set()` method (peer
host).

The function will be executed on each intercepted request with the [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
as the first argument.

The function must return a `Boolean` where `false` will **not** trip the breaker and `true`
will trip the breaker.

Example of tripping the breaker only when the downstream server responds with http status
code 500:

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com', {
    onResponse: (res) => {
        if (res.statusCode === 500) {
            return true;
        }
        return false;
    }
});

breaker.enable();

// Will choke on 500 errors, and trigger breaker
request('http://api.somewhere.com', (error, response, body) => {
    console.log(body);
});
```

NOTE: Its adviced to **not** do any asyncronous operations in this method.


## Timeouts

One aspect of monitoring health status of a downstream service is timeouts of the http
calls to the service.

Circuit-b is monitoring the events on [`Net.socket`](https://nodejs.org/api/net.html#net_class_net_socket)
which all http request libraries is build upon. Among the monitored events is the
[`timeout`](https://nodejs.org/api/net.html#net_event_timeout) event. But in the eyes of
a http request library a timeout is more than the emitted `timeout` event on `Net.socket`.
As a result of this; timeouts are in many cases slightly different implemented accross
http request libraries.

Some http request library does emit a `timeout` event on the `Net.socket` it holds when
the librarys own timeout algorithm detects a timeout. But not all do this.

Unless a http request library does emit a `timeout` event on the `Net.socket` it holds,
Circuit-b is not able to detect timeouts happening in library code. Due to this circuit-b
has its own timeout mechanism to make sure timeouts is treated equally between http
request libraries.

This mechanism works as follow:

 * Timeout starts when a http request is initiated.
 * The timeout period will end when the first data event is emitted on the socket.
 * If a data event is not fired within the set timeout, the socket will be destroyed with a `CircuitBreakerTimeoutError` error object.
 * The destruction of the socket will surface to the http library which initiated the request in form of an error.

When configuring timeouts it is important to make sure that the timeout set for a host
in circuit-b is the same, or shorter than the configured timeout set for the http
library which initiates the request. If so is not done, there is a risk that circuit-b
can miss out on timeouts.

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com', { timeout: 5000 });
breaker.set('api.elsewhere.net', { timeout: 10000 });

breaker.enable();

// Will timeout after 5 seconds, and trigger breaker
request('http://api.somewhere.com', (error, response, body) => {
    console.log(body);
});

// Will timeout after 10 seconds, and trigger breaker
request('http://api.elsewhere.net', (error, response, body) => {
    console.log(body);
});
```


## Error handling when timing out

When the circuit breaker is detecting timeouts the http requests will be terminated
with a `CircuitBreakerTimeoutError` error object.

This error object can be used to choose what to do one timeout requests.

```js
const request = require('request');
const Breaker = require('circuit-b');

const breaker = new Breaker();

breaker.set('api.somewhere.com', { timeout: 5000 });

breaker.enable();

request('http://api.somewhere.com', (error, response, body) => {
    if (error) {
        if (error.code === 'CircuitBreakerTimeout') {
            console.log('Downstream service is timing out');
        } else {
            console.log('Something went humpty dumpty');
        }
        return;
    }
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

breaker.set('api.somewhere.com', { timeout: 5000 });

breaker.enable();

request('http://api.somewhere.com', (error, response, body) => {
    if (error) {
        if (error.code === 'CircuitBreakerOpenException') {
            console.log('Downstream service is curcuit broken');
        } else {
            console.log('Something went humpty dumpty');
        }
        return;
    }
    console.log(body);
});
```


## Clients with retries

There are http clients out there which will retry http requests under the hood if
it encounters certain errors (network errors, server errors etc).

This plays out as follow: one initializes a request with the http client where
it ex is configured to retry two times if it encounters an error. When the client
encounters an error is should retry on, it will under the hood, assuming the
errors continue, do two extra requests in addition to the initial request before
it surfaces the error to the user of the client. In this example; what looks like
one request for the user of the client are in reality three requests.

Since circuit-b listen on [`Net.socket`](https://nodejs.org/api/net.html#net_class_net_socket)
events it will register the retry requests on clients with such features. In the
above example, circuit-b will have registered three failed requests. Not one.

The Circuit Breaker pattern is a pattern to reduce traffic to a upstream service
when it errors. A retry pattern on a http client is quite the opposite of this
pattern.

Due to this; it is adviced that if the http client has retry functionallity, this
feature should be configured to off or set to 0 retries.

If one are not able to configure this it might be valuable to set `maxFailures` a
bit higher so there is a bit higher margin before the breaker kicks in.

Known http clients with default retries:

 * [got](https://github.com/sindresorhus/got)


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
