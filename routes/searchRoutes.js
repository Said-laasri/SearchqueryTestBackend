// routes/searchRoutes.js
const express = require('express');
const searchController = require('../controllers/searchController');
const router = express.Router();

router.get('/api/v1/search', searchController.handleSearch);

module.exports = router;