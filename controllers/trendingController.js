const Products = require('../models/productsModel');
const Trending = require('../models/trendingModel');

async function getTrendingByCategory(req, res) {
    const { categoryId } = req.query;
    if (!categoryId) {
        return res.status(400).json({ error: 'Missing category ID' });
    }

    try {
        const trendingProducts = await Trending.getTrendingByCategory(categoryId);
        console.log(trendingProducts);
        if (!Object.keys(trendingProducts).length) {
            return res.status(200).json([])
        }

        const products = await Products.getProducts(Object.keys(trendingProducts));
        products.map((product) => product['rank'] = trendingProducts[product.productSin]);
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get trending products.' });
    }

}

module.exports = { getTrendingByCategory };
