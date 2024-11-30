const express = require('express');
const { getTrendingByCategory } = require('../controllers/trendingController');

const router = express.Router();

// GET API for fetching trending products
router.get('/trending-products', getTrendingByCategory);

module.exports = router;