// images.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { saveToDynamoDB } = require('./dynamoDBService'); // Import the saveToDynamoDB function from dynamoDBService.js

router.get('/getProducts', async (req, res) => {
  try {
    const { category, gender, userId } = req.query;

    // Set up API request parameters
    const params = {
      q: category || '', // Search query parameter (category), defaults to an empty string if not provided
      dept: gender && gender.toUpperCase() === 'MEN' ? 'MENS' : 'WOMENS', // Department based on gender
      limit: 50, // Limit the number of results to 50
      lang: 'en-US', // Set the language to English
      allowOutOfStockItems: 'false', // Exclude out-of-stock items
      siteId: '1006', // Site ID for Shopbop
    };

    // Remove any undefined or empty parameters
    Object.keys(params).forEach(
      (key) => (params[key] === '' || params[key] === undefined) && delete params[key]
    );

    // Set up headers for the Shopbop API request
    const headers = {
      accept: 'application/json', // Set header to accept JSON responses
      'Client-Id': process.env.CLIENT_ID, // Client ID from environment variables
      'Client-Version': process.env.CLIENT_VERSION, // Client version from environment variables
    };

    // Make a request to Shopbop's API to fetch product data
    const response = await axios.get('https://api.shopbop.com/public/search', {
      params, // Pass the query parameters
      headers, // Pass the headers
    });

    const products = response.data.products || []; // Extract products array from response
    const baseImageUrl = 'https://m.media-amazon.com/images/G/01/Shopbop/p'; // Base URL for product images
    const productsData = [];

    // Process each product and prepare data for DynamoDB
    products.forEach((item) => {
      const product = item.product;
      if (product) {
        const productSin = product.productSin || ''; // Product identifier
        const shortDescription = product.shortDescription || ''; // Short description of the product
        const name = product.designerName || ''; // Designer or brand name
        const price = (product.retailPrice && product.retailPrice.price) || ''; // Product price
        let imageUrl = '';

        // Get the first image URL if available
        if (product.colors && Array.isArray(product.colors)) {
          const color = product.colors[0]; // Access the first color
          if (color.images && Array.isArray(color.images)) {
            const image = color.images[0]; // Access the first image for the color
            if (image.src) {
              imageUrl = baseImageUrl + image.src; // Concatenate base URL with image source path
            }
          }
        }

        // Ensure all required fields are present
        if (imageUrl && productSin && shortDescription && name && price) {
          const itemData = {
            UserID: userId || 'sampleUser', // Use provided userId or default to 'sampleUser'
            ProductID: productSin, // Unique identifier for the product
            ProductName: name, // Product name or designer name
            Price: price, // Price of the product
            ImageURL: imageUrl, // URL for the product's image
          };
          saveToDynamoDB(itemData); // Save product data to DynamoDB
        }
      }
    });

    res.json({ message: 'Data fetched and stored in DynamoDB' }); // Response to indicate success
  } catch (error) {
    console.error('Error fetching products:', error.message); // Log error if fetching fails
    res.status(500).json({ error: 'Error fetching products' }); // Send error response to client
  }
});

module.exports = router;
