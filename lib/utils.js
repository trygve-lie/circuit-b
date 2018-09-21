'use strict';

const util = require('util');
const fs = require('fs');

const Log = class Log {
    constructor(enabled = true) {
        this.enabled = enabled;
    }

    info(...args) {
        if (this.enabled) {
            fs.writeSync(process.stdout.fd, `${util.format(...args)}\n`);
        }
    }
};
module.exports.Log = Log;
