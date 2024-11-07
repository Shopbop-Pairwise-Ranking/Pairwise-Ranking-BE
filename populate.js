const express = require('express');
const router = express.Router();
const axios = require('axios');
const { dynamoDB } = require('./dynamoDBService');

// Categories to fetch products from
const categories = ['dresses', 'shoes', 'bags', 'jeans', 'tops'];
const departments = ['WOMENS', 'MENS'];

async function fetchProducts(category, dept, offset = 0) {
  const params = {
    q: category,
    dept: dept,
    limit: 50, // Maximum allowed per request
    lang: 'en-US',
    allowOutOfStockItems: 'false',
    siteId: '1006',
    offset: offset
  };

  const headers = {
    accept: 'application/json',
    'Client-Id': process.env.CLIENT_ID,
    'Client-Version': process.env.CLIENT_VERSION,
  };

  const response = await axios.get('https://api.shopbop.com/public/search', {
    params,
    headers,
  });

  return response.data;
}

async function processProduct(product) {
  const baseImageUrl = 'https://m.media-amazon.com/images/G/01/Shopbop/p';
  
  if (!product) return null;

  const productSin = product.productSin;
  const shortDescription = product.shortDescription;
  const name = product.designerName;
  const price = product.retailPrice?.price;
  let imageUrl = '';

  if (product.colors?.[0]?.images?.[0]?.src) {
    imageUrl = baseImageUrl + product.colors[0].images[0].src;
  }

  // Only return product if all required fields are present
  if (imageUrl && productSin && shortDescription && name && price) {
    return {
      ProductID: productSin,
      ProductName: shortDescription,
      DesignerName: name,
      Price: price,
      ImageURL: imageUrl
    };
  }

  return null;
}

async function insertIntoDynamoDB(items) {
  const batchSize = 25; // DynamoDB batch write limit
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const writeRequests = batch.map(item => ({
      PutRequest: {
        Item: item
      }
    }));

    const params = {
      RequestItems: {
        'Products': writeRequests // Replace 'Products' with your table name
      }
    };

    try {
      await dynamoDB.batchWrite(params).promise();
      console.log(`Inserted batch ${i / batchSize + 1}`);
    } catch (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }
  }
}

router.post('/populateDynamoDB', async (req, res) => {
  try {
    const allProducts = [];

    for (const dept of departments) {
      for (const category of categories) {
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          console.log(`Fetching ${dept} ${category} with offset ${offset}`);
          
          const data = await fetchProducts(category, dept, offset);
          const products = data.products || [];
          
          if (products.length === 0) {
            hasMore = false;
            continue;
          }

          // Process each product
          const processedProducts = await Promise.all(
            products.map(item => processProduct(item.product))
          );

          // Filter out null values and add valid products
          const validProducts = processedProducts.filter(p => p !== null);
          allProducts.push(...validProducts);

          // Update offset for next batch
          offset += products.length;

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Insert all products into DynamoDB
    await insertIntoDynamoDB(allProducts);

    res.status(200).json({
      message: 'Data successfully inserted into DynamoDB',
      totalProducts: allProducts.length
    });

  } catch (error) {
    console.error('Error in population script:', error);
    res.status(500).json({
      error: 'Failed to populate DynamoDB',
      message: error.message
    });
  }
});

module.exports = router;