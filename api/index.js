const express = require('express');
const searchRoute = require('../routes/search');
const db = require('../db');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use('/api/search', searchRoute);

module.exports.handler = serverless(app);
