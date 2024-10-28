// routes/images.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Define the /getImages endpoint
router.get('/getImages', async (req, res) => {
  try {
    const { q, limit, minPrice, maxPrice, dept, sort, offset } = req.query;

    // Validate and set default parameters
    const params = {
      q: q || '',
      limit: limit && !isNaN(limit) ? parseInt(limit) : 40,
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
      dept: dept || 'WOMENS',
      lang: 'en-US',
      allowOutOfStockItems: 'false',
      siteId: '1006',
      sort: sort || '',
      offset: offset && !isNaN(offset) ? parseInt(offset) : 0,
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

    // Make the API call to Shopbop
    const response = await axios.get('https://api.shopbop.com/public/search', {
      params,
      headers,
    });

    // Log the response data for debugging
    console.log('API Response:', JSON.stringify(response.data, null, 2));

    // Extract products from the response
    const products = response.data.products || [];
    const baseImageUrl = 'https://m.media-amazon.com/images/G/01/Shopbop/p';
    const imageUrls = [];

    products.forEach((item) => {
      const product = item.product;
      if (product && product.colors) {
        product.colors.forEach((color) => {
          if (color.images) {
            color.images.forEach((image) => {
              if (image.src) {
                const imageUrl = baseImageUrl + image.src;
                imageUrls.push(imageUrl);
              }
            });
          }
        });
      }
    });

    res.json({ imageUrls });
  } catch (error) {
    console.error('Error fetching images:', error.message);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

module.exports = router;
