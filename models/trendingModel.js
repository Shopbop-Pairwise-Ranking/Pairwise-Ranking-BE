const dynamoDB = require("../config/dynamoDBConfig");

const TRENDING_TABLE = process.env.TRENDING_TABLE;

class Trending {
  static async getTrendingByCategory(categoryId) {
    const params = {
      TableName: TRENDING_TABLE,
      Key: { categoryId },
    };

    try {
      const result = await dynamoDB.get(params).promise();

      if (!result.Item || !result.Item.runs) {
        return [];
      }

      const { runs, latestTrending } = result.Item;

      if (!runs[latestTrending]) {
        return [];
      }

      return runs[latestTrending];
    } catch (error) {
      console.error("Error fetching trending products:", error.message);
      return [];
    }
  }
}
module.exports = Trending;
