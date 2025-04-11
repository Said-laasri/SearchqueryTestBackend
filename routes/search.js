const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) return res.status(400).json({ error: 'Search query required' });

  try {
    const result = await db.query(
      `SELECT id, name, description
       FROM items
       WHERE searchable @@ plainto_tsquery($1)
       ORDER BY ts_rank(searchable, plainto_tsquery($1)) DESC
       LIMIT 20`,
      [searchQuery]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
