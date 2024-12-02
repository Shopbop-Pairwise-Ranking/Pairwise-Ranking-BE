const Rankings = require('../models/rankingsModel');
const Products = require('../models/productsModel');
const { calculateElo } = require('../utils/helper');
const calculateAndSaveRecommendations = require('./recommendationController');

async function updateRanking(req, res) {
    const { userId, categoryId } = req.params;
    const { matchups, rankings } = req.body;

    if (!userId || !categoryId || !matchups || !rankings) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!matchups.length || !Object.keys(rankings).length || (matchups.length * 2) !== Object.keys(rankings).length) {
        return res.status(400).json({ error: 'No. of rankings does not match the items provided' });
    }

    try {
        const rankingId = await Rankings.updateRanking(userId, categoryId, rankings);
        const productIds = [];
        matchups.forEach(matchup => {
            const { itemA, itemB } = matchup;
            productIds.push(itemA, itemB);
        });
        const uniqueProductIds = [...new Set(productIds)];
        const products = await Products.getProducts(uniqueProductIds);

        for(const matchup of matchups) {
            const { itemA, itemB, winner } = matchup;

            const productA = products.find(p => p.productSin === itemA);
            const productB = products.find(p => p.productSin === itemB);
            const ratingA = productA?.eloRating || 1000;
            const ratingB = productB?.eloRating || 1000;

            const result = winner === itemA ? 1 : 0;
            const { newRatingA, newRatingB } = calculateElo(ratingA, ratingB, result);
            await Promise.all([
                Products.updateProductRating(itemA, newRatingA, winner === itemA),
                Products.updateProductRating(itemB, newRatingB, winner === itemB)
            ]);
        }
        calculateAndSaveRecommendations(userId, categoryId, rankingId);
        res.status(200).json({ message: 'Rankings and products updated successfully', rankingId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update rankings and products' });
    }
}

async function getLatestRankings(req, res) {
    const { userId, categoryId } = req.query;
    if (!userId || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const latestRanking = await Rankings.getLatestRanking(userId, categoryId);
        if (!latestRanking?.ranks) {
            return res.status(200).json({message: 'userId does not exist'})
        }

        if (!latestRanking?.recommendations) {
            latestRanking.recommendations = [];
        }
        if (latestRanking.recommendations.length) {
            const recommendedProductIds = latestRanking.recommendations;
            latestRanking.recommendations = await Products.getProducts(recommendedProductIds);
        }

        const productIds = Object.keys(latestRanking.ranks);
        const products = await Products.getProducts(productIds);
        latestRanking.products = products;
        res.json(latestRanking);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch latest ranking' });
    }

}

async function getRecommendations(req, res) {
    const { userId, categoryId, lastestRankingId } = req.query;
    if (!userId || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const recommendedProductIds = await Rankings.getRecommendations(userId, categoryId, lastestRankingId);
        if (!recommendedProductIds.length) {
            return res.status(200).json([])
        }
        const products = await Products.getProducts(recommendedProductIds);
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to recommend products at the moment.' });
    }

}

module.exports = { updateRanking, getLatestRankings, getRecommendations };
