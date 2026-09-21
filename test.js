const assert = require('assert');
const { helloHandler } = require('./app');

let responseBody = null;

const mockResponse = {
    send: (body) => {
        responseBody = body;
    }
};

helloHandler({}, mockResponse);

assert.strictEqual(responseBody, 'Hello World!');

console.log('Unit test passed: GET / returns Hello World!');
