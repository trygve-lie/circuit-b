'use strict';

module.exports = (res = {}) => {
    if (res.statusCode === undefined) {
        return true;
    }

    let result = false;
    switch (res.statusCode){
        case 408: // Request Timeout
            result = true;
            break;

        case 413: // Payload Too Large
            result = true;
            break;

        case 429: // Too Many Requests
            result = true;
            break;

        case 500: // Internal Server Error
            result = true;
            break;

        case 502: // Bad Gateway
            result = true;
            break;

        case 503: // Service Unavailable
            result = true;
            break;

        case 504: // Gateway Timeout
            result = true;
            break;

        default:
            result = false;
    }

    return result;
}
