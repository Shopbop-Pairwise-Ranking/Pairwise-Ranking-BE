const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
console.log("........STARTED........");

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);

exports.handler = async () => {
  const trendingTableName = "Trending";
  const productsTableName = "Products";

  console.log("Starting the handler for trending updates...");

  try {

    console.log(`Scanning table: ${productsTableName}`);
    const productsData = await dynamoDb.send(new ScanCommand({ TableName: productsTableName }));
    const allProducts = productsData.Items;
    console.log(`Fetched ${allProducts.length} products from ${productsTableName}`);

    const categoryScores = {};


    console.log("Calculating trending scores for products...");
    allProducts.forEach(product => {
      const { categoryID, eloRating = 1000, wins = 0, losses = 0 } = product;


      const score = eloRating * (1 + Math.log(1 + wins) - Math.log(1 + losses));

      if (!categoryScores[categoryID]) categoryScores[categoryID] = [];
      categoryScores[categoryID].push({ productId: product.productSin, score });
    });

    console.log("Trending scores calculated. Preparing updates for the trending table...");


    const timestamp = new Date().toISOString();
    const updates = [];

    for (const [categoryId, products] of Object.entries(categoryScores)) {
      console.log(`Processing category: ${categoryId}`);


      products.sort((a, b) => b.score - a.score);
      const topProducts = products.slice(0, 10);

      console.log(`Top 10 products for category ${categoryId}:`, topProducts);

      const newRunId = randomUUID();


      const ranks = topProducts.reduce((acc, p, idx) => {
        acc[p.productId] = idx + 1; // Rank 1-based
        return acc;
      }, {});

      console.log(`Generated ranks for category ${categoryId}:`, ranks);


      console.log(`Fetching existing runs for category ${categoryId} from table ${trendingTableName}`);
      const existingData = await dynamoDb.send(new GetCommand({
        TableName: trendingTableName,
        Key: { categoryId },
      }));

      const existingRuns = existingData.Item?.runs || {};


      existingRuns[newRunId] = {
        ranks,
        timestamp,
      };

      console.log(`Updated runs for category ${categoryId}:`, existingRuns);


      console.log(`Updating table ${trendingTableName} for category ${categoryId}`);
      updates.push(
        dynamoDb.send(
          new UpdateCommand({
            TableName: trendingTableName,
            Key: { categoryId },
            UpdateExpression: "SET #latestTrending = :latest, #runs = :runs",
            ExpressionAttributeNames: {
              "#latestTrending": "latestTrending",
              "#runs": "runs",
            },
            ExpressionAttributeValues: {
              ":latest": newRunId,
              ":runs": existingRuns,
            },
          })
        )
      );
    }


    console.log("Executing all updates in parallel...");
    await Promise.all(updates);

    console.log("Trending scores updated successfully!");
  } catch (error) {
    console.error("Error updating trending scores:", error);
    throw error;
  }
};
