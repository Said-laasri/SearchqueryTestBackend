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
       WHERE name ILIKE $1 OR description ILIKE $1
       ORDER BY name ASC
       LIMIT 20`,
      [`${searchQuery}%`] // Removed the leading '%'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;