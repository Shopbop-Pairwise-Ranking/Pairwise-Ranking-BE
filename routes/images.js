const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/getProducts', async (req, res) => {
  try {
    const { category, gender, userId } = req.query;

    // Validate and set default parameters
    const params = {
      q: category || '',
      dept: gender && gender.toUpperCase() === 'MEN' ? 'MENS' : 'WOMENS',
      limit: 50,
      lang: 'en-US',
      allowOutOfStockItems: 'false',
      siteId: '1006',
    };

    // Remove empty parameters
    Object.keys(params).forEach(
      (key) => (params[key] === '' || params[key] === undefined) && delete params[key]
    );

    const headers = {
      accept: 'application/json',
      'Client-Id': process.env.CLIENT_ID,
      'Client-Version': process.env.CLIENT_VERSION,
    };
    const response = await axios.get('https://api.shopbop.com/public/search', {
      params,
      headers,
    });
    const products = response.data.products || [];
    const baseImageUrl = 'https://m.media-amazon.com/images/G/01/Shopbop/p';
    const productsData = [];

    products.forEach((item) => {
      const product = item.product;
      if (product) {
        const productSin = product.productSin || '';
        const shortDescription = product.shortDescription || '';
        const name = product.designerName || '';
        const price =
          (product.retailPrice && product.retailPrice.price) || '';
        let imageUrl = '';

        if (product.colors && Array.isArray(product.colors)) {
          // Use the first color
          const color = product.colors[0];
          if (color.images && Array.isArray(color.images)) {
            // Use the first image
            const image = color.images[0];
            if (image.src) {
              imageUrl = baseImageUrl + image.src;
            }
          }
        }

        // Add the product to the array if it has an image and all fields are present
        if (imageUrl && productSin && shortDescription && name && price) {
          productsData.push({
            productSin,
            shortDescription,
            name,
            price,
            imageUrl,
          });
        }
      }
    });
    const totalProductsNeeded = 10;
    const limitedProductsData = productsData.slice(0, totalProductsNeeded);
    const groups = {};
    const productsPerLevel = 2;

    for (let i = 0; i < 5; i++) {
      const start = i * productsPerLevel;
      const end = start + productsPerLevel;
      groups[(i + 1).toString()] = limitedProductsData.slice(start, end);
    }

    res.json(groups);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

module.exports = router;
