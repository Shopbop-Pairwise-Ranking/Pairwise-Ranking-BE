const express = require('express');
const { updateRanking, getLatestRankings, getRecommendations} = require('../controllers/rankingController');

const router = express.Router();

// POST API for updating rankings and products
router.post('/update-ranking/user/:userId/category/:categoryId', updateRanking);

// GET API for fetching latest ranking
router.get('/latest-ranking', getLatestRankings);

// GET API for fetching recommendation
router.get('/recommendations', getRecommendations);

module.exports = router;
