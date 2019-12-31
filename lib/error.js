'use strict';

const CircuitBreakerOpenExceptionError = require('./error-open-exception');
const CircuitBreakerTimeoutError = require('./error-timeout');

/*
class CircuitBreakerOpenExceptionError extends Error {
    constructor(message) {
        super(message);
        this.code = 'CircuitBreakerOpenException';
        this.message = message || '';
    }
}
*/
module.exports.CircuitBreakerOpenExceptionError = CircuitBreakerOpenExceptionError;

/*
class CircuitBreakerTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.code = 'CircuitBreakerTimeout';
        this.message = message || '';
    }
}
*/
module.exports.CircuitBreakerTimeoutError = CircuitBreakerTimeoutError;
