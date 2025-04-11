// Load environment variables
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg'); // Use the Pool for connection management

const app = express();
const port = process.env.PORT || 3001;

// --- Database Connection Pool ---
// The pool manages multiple client connections automatically
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

// --- Middleware ---
app.use(express.json()); // Middleware to parse JSON bodies (optional for this GET endpoint)
// Consider adding CORS middleware if your front-end is on a different origin
// const cors = require('cors');
// app.use(cors());

// --- API Route Handler for Search ---
app.get('/api/v1/search', async (req, res) => {
    const { q, category } = req.query;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'relevance'; // Default sort
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC'; // Default DESC

    // --- Input Validation ---
    if (!q || typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({ error: "Missing or invalid 'q' query parameter" });
    }
    if (isNaN(limit) || limit <= 0 || limit > 50) { // Validate limit
        return res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 50.' });
    }

    let client; // Declare client outside try block for finally clause
    try {
        // --- Get Connection from Pool ---
        client = await pool.connect(); // Asynchronously gets a client connection

        // --- Prepare Search Term & Query ---
        // Use websearch_to_tsquery for better handling of user input, append ':*' for prefix matching
        const searchTerm = q.trim() + ':*';
        const tsQueryFunc = 'websearch_to_tsquery'; // Or 'plainto_tsquery'
        const queryParams = [searchTerm];
        let paramIndex = 1; // Parameter index for pg ($1, $2, ...)

        // --- Base SQL ---
        // Use aliases for clarity, calculate relevance score
        let sql = `
            SELECT
                sc.id, sc.title, sc.description, sc.url, sc.image_url, sc.category,
                ts_rank_cd(sc.search_vector, query) AS score
            FROM
                searchable_content sc,
                ${tsQueryFunc}('pg_catalog.english', $${paramIndex++}) query
            WHERE
                sc.search_vector @@ query
        `;
        queryParams.push(searchTerm); // Add search term for the WHERE clause matching

        // --- Add Optional Filters ---
        if (category && typeof category === 'string') {
            sql += ` AND sc.category = $${paramIndex++}`;
            queryParams.push(category);
        }

        // --- Add Sorting ---
        // Carefully construct ORDER BY to avoid SQL injection if sortBy is user-controlled
        // It's safer to map allowed sortBy values to actual column names/expressions
        let orderByClause = 'score DESC'; // Default order by relevance
        if (sortBy === 'title') {
            orderByClause = `sc.title ${sortOrder}`;
        } else if (sortBy === 'created_at') {
             orderByClause = `sc.created_at ${sortOrder}`;
        } // Add more allowed sort fields if needed
        sql += ` ORDER BY ${orderByClause}, sc.id ASC`; // Add secondary sort for stable order

        // --- Add Limit ---
        sql += ` LIMIT $${paramIndex++}`;
        queryParams.push(limit);

        // --- Execute Query ---
        console.log('Executing SQL:', sql); // Optional: Log the query
        console.log('With Params:', queryParams); // Optional: Log parameters
        const { rows } = await client.query(sql, queryParams);

        // --- Format and Send Response ---
        const responseData = {
            data: rows,
            metadata: {
                query: q,
                limit: limit,
                returned: rows.length,
                // totalMatches: count // Getting total requires another potentially expensive query
            }
        };
        res.status(200).json(responseData);

    } catch (err) {
        console.error('Search API Error:', err);
        // Differentiate between DB errors and other errors if needed
        if (err.code && err.code.startsWith('22')) { // PostgreSQL data exception errors (e.g., invalid FTS query syntax)
             res.status(400).json({ error: 'Invalid search query format' });
        } else {
             res.status(500).json({ error: 'Internal server error while searching' });
        }
    } finally {
        // --- Release Client Connection ---
        // VERY IMPORTANT: Release the client back to the pool when done.
        if (client) {
            client.release();
        }
    }
});

// --- Basic Root Route ---
app.get('/', (req, res) => {
    res.send('Live Search Backend API is running!');
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});