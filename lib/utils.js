'use strict';

const isFunction = fn => {
    const type = {}.toString.call(fn);
    return type === '[object Function]' || type === '[object AsyncFunction]';
};
module.exports.isFunction = isFunction;
