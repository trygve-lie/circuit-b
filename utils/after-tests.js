'use strict';

const hostile = require('hostile');

const removeHost = (host = 'circuit-b.local') => new Promise((resolve, reject) => {
    hostile.remove('127.0.0.1', host, (error) => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
});

const run = async () => {
    try {
        await removeHost({ host: 'circuit-b-axios.local' });
        await removeHost({ host: 'circuit-b-fetch.local' });
        await removeHost({ host: 'circuit-b-got.local' });
        await removeHost({ host: 'circuit-b-http.local' });
        await removeHost({ host: 'circuit-b-metrics.local' });
        await removeHost({ host: 'circuit-b-request.local' });
    } catch (error) {
        console.log(error);
    }
};
run();
