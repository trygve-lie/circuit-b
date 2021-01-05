'use strict';

const hostile = require('hostile');

const setHost = (host = 'circuit-b.local') => new Promise((resolve, reject) => {
    hostile.set('127.0.0.1', host, (error) => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
});

const run = async () => {
    try {
        await setHost({ host: 'circuit-b-axios.local' });
        await setHost({ host: 'circuit-b-fetch.local' });
        await setHost({ host: 'circuit-b-got.local' });
        await setHost({ host: 'circuit-b-http.local' });
        await setHost({ host: 'circuit-b-metrics.local' });
        await setHost({ host: 'circuit-b-request.local' });
    } catch (error) {
        console.log(error);
    }
};
run();
