const Products = require('../models/productsModel');
const Trending = require('../models/trendingModel');

async function getTrendingByCategory(req, res) {
    const { categoryId } = req.query;
    if (!categoryId) {
        return res.status(400).json({ error: 'Missing category ID' });
    }
    try {
        const trendingRunInfo = await Trending.getTrendingByCategory(categoryId);
        if (trendingRunInfo?.ranks?.length) {
            return res.status(200).json({})
        }

        const products = await Products.getProducts(Object.keys(trendingRunInfo.ranks));
        products.map((product) => product['rank'] = trendingRunInfo.ranks[product.productSin]);
        res.json({ products, timestamp: trendingRunInfo?.timestamp || new Date().toISOString() });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get trending products.' });
    }

}

module.exports = { getTrendingByCategory };
