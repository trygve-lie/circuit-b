'use strict';

class CircuitBreakerOpenExceptionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerOpenException';
        this.message = message || '';
    }
}

module.exports = CircuitBreakerOpenExceptionError;
