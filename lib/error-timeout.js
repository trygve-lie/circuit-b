'use strict';

class CircuitBreakerTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.code = 'CircuitBreakerTimeout';
        this.message = message || '';
    }
}
module.exports = CircuitBreakerTimeoutError;
