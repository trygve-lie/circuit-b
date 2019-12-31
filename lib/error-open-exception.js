'use strict';

class CircuitBreakerOpenExceptionError extends Error {
    constructor(message) {
        super(message);
        this.code = 'CircuitBreakerOpenException';
        this.message = message || '';
    }
}
module.exports = CircuitBreakerOpenExceptionError;
