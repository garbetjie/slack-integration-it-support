// Create application.
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

// Set up middleware.
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.query());
app.use(bodyParser.json());

app.post('/slack', require('./index').main);

// Start listening.
app.listen(3000);