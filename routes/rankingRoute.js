const express = require('express');
const { updateRanking } = require('../controllers/rankingController');

const router = express.Router();

// POST API for updating rankings and products
router.post('/update-ranking/user/:userId/category/:categoryId', updateRanking);

module.exports = router;
