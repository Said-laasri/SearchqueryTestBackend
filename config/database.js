// config/database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Recommended: Add connection timeout and max connections
    // connectionTimeoutMillis: 5000, // time to wait for connection before error
    // max: 10, // max number of clients in the pool
    // idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Exit if pool has critical error
});

module.exports = pool;