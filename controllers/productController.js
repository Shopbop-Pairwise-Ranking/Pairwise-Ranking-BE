const Rankings = require("../models/rankingsModel");
const Products = require("../models/productsModel");

async function getProducts(req, res) {
  try {
    const { category, userId, gender } = req.query;
    console.log(category, userId, gender)

    if (!category || !userId || !gender) {
      return res
        .status(400)
        .json({
          error: "Missing required parameters: category, userId, and gender",
        });
    }

    const userRankings = await Rankings.getUserRankingsByCategory(userId, category);
    console.log(userRankings)
    const rankedProductIds = new Set();

    if (userRankings && userRankings.rankings) {
      Object.values(userRankings.rankings).forEach((ranking) => {
        if (ranking.ranks) {
          Object.keys(ranking.ranks).forEach((productId) =>
            rankedProductIds.add(productId)
          );
        }
        if (ranking.recommendations) {
          ranking.recommendations.forEach((productId) =>
            rankedProductIds.add(productId)
          );
        }
      });
    }

    const allProducts = await Products.getProductsByCateogryAndGender(category, gender);

    const filteredProducts = allProducts.filter((product) => !rankedProductIds.has(product.productId));

    const totalProductsNeeded = 10;
    const randomlySelectedProducts = [];
    const usedIndexes = new Set();

    while (randomlySelectedProducts.length < totalProductsNeeded && filteredProducts.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredProducts.length);
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        randomlySelectedProducts.push(filteredProducts[randomIndex]);
      }
    }
    const groups = {};
    const productsPerLevel = 2;

    for (let i = 0; i < Math.ceil(randomlySelectedProducts.length / productsPerLevel); i++) {
      const start = i * productsPerLevel;
      const end = start + productsPerLevel;
      groups[(i + 1).toString()] = randomlySelectedProducts.slice(start, end);
    }

    res.json(groups);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Error fetching products" });
  }
}

module.exports = { getProducts };
