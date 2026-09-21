const express = require('express');

const app = express();

const port = process.env.PORT || 8080;

// Route handler kept separate so it can be unit tested.
const helloHandler = (req, res) => {
    res.send('Hello World!');
};

app.get('/', helloHandler);

// Start the HTTP server only when this file is executed directly.
// Requiring app.js from a test will not start the server.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`App running on http://localhost:${port}`);
    });
}

module.exports = {
    app,
    helloHandler
};
