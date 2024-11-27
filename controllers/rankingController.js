const Rankings = require('../models/rankingsModel');
const Products = require('../models/productsModel');
const { calculateElo } = require('../utils/helper');

async function updateRanking(req, res) {
    const { userId, categoryId } = req.params;
    const { matchups, rankings } = req.body;

    if (!userId || !categoryId || !matchups || !rankings) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log(matchups, rankings)
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

            const productA = products.find(p => p.productSin === itemA) || { eloRating: 1000 };
            const productB = products.find(p => p.productSin === itemB) || { eloRating: 1000 };

            const ratingA = productA.eloRating;
            const ratingB = productB.eloRating;

            const result = winner === itemA ? 1 : 0;
            const { newRatingA, newRatingB } = calculateElo(ratingA, ratingB, result);

            await Promise.all([
                Products.updateProductRating(itemA, newRatingA, winner === itemA),
                Products.updateProductRating(itemB, newRatingB, winner === itemB)
            ]);
        }
        // Trigger recommendation engine
        res.status(200).json({ message: 'Rankings and products updated successfully', rankingId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update rankings and products' });
    }
}

module.exports = { updateRanking };
