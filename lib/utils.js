'use strict';

const util = require('util');
const fs = require('fs');

const log = (...args) => {
    fs.writeSync(process.stdout.fd, `${util.format(...args)}\n`);
};
module.exports.log = log;
