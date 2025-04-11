// controllers/searchController.js
const searchModel = require('../models/searchModel');

async function handleSearch(req, res) {
    const { q, category } = req.query;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'relevance';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Input Validation
    if (!q || typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({ error: "Missing or invalid 'q' query parameter" });
    }
    if (isNaN(limit) || limit <= 0 || limit > 50) {
        return res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 50.' });
    }

    try {
        const results = await searchModel.searchContent(q, category, limit, sortBy, sortOrder);

        const responseData = {
            data: results,
            metadata: {
                query: q,
                limit: limit,
                returned: results.length,
                // totalMatches: count // Getting total requires another potentially expensive query
            }
        };
        res.status(200).json(responseData);

    } catch (err) {
        console.error('Controller Error in handleSearch:', err);
        if (err.code && err.code.startsWith('22')) {
            res.status(400).json({ error: 'Invalid search query format' });
        } else {
            res.status(500).json({ error: 'Internal server error while searching' });
        }
    }
}

module.exports = { handleSearch };