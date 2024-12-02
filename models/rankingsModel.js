const { v4: uuidv4 } = require("uuid");
const dynamoDB = require("../config/dynamoDBConfig");
const RANKINGS_TABLE = process.env.RANKINGS_TABLE;

class Rankings {
  static async updateRanking(userId, categoryId, ranking) {
    const rankingId = uuidv4();
    const timestamp = new Date().toISOString();

    const getParams = {
      TableName: RANKINGS_TABLE,
      Key: { userId, categoryId },
    };

    const existingItem = await dynamoDB.get(getParams).promise();

    if (existingItem.Item) {
      const updateParams = {
        TableName: RANKINGS_TABLE,
        Key: { userId, categoryId },
        UpdateExpression: `
                    SET #rankings.#newRankingId = :newRanking,
                        latestRankingId = :rankingId
                `,
        ExpressionAttributeNames: {
          "#rankings": "rankings",
          "#newRankingId": rankingId,
        },
        ExpressionAttributeValues: {
          ":newRanking": {
            ranks: ranking,
            timestamp,
            recommendations: [],
          },
          ":rankingId": rankingId,
        },
      };
      await dynamoDB.update(updateParams).promise();
    } else {
      const putParams = {
        TableName: RANKINGS_TABLE,
        Item: {
          userId,
          categoryId,
          latestRankingId: rankingId,
          rankings: {
            [rankingId]: {
              ranks: ranking,
              timestamp,
              recommendations: [],
            },
          },
        },
      };
      await dynamoDB.put(putParams).promise();
    }

    return rankingId;
  }

  static async getUserRankingsByCategory(userId, categoryId) {
    const params = {
      TableName: RANKINGS_TABLE,
      Key: { userId, categoryId },
    };

    const result = await dynamoDB.get(params).promise();
    return result.Item || null;
  }

  static async getLatestRanking(userId, categoryId) {
    const params = {
      TableName: RANKINGS_TABLE,
      Key: { userId, categoryId },
    };

    try {
      const result = await dynamoDB.get(params).promise();

      if (!result.Item || !result.Item.rankings) {
        return {};
      }

      const { latestRankingId, rankings } = result.Item;

      if (!latestRankingId || !rankings[latestRankingId]) {
        return {};
      }

      const latestRanking = rankings[latestRankingId];

      return {
        latestRankingId,
        ranks: latestRanking.ranks,
        recommendations: latestRanking.recommendations,
        timestamp: latestRanking.timestamp,
      };
    } catch (error) {
      console.error("Error fetching the latest ranking:", error.message);
      throw error;
    }
  }

  static async getRecommendations(userId, categoryId, latestRankingId) {
    const params = {
      TableName: RANKINGS_TABLE,
      Key: { userId, categoryId },
    };

    try {
      const result = await dynamoDB.get(params).promise();

      if (!result.Item || !result.Item.rankings) {
        return [];
      }

      const { rankings } = result.Item;

      if (!latestRankingId) {
        latestRankingId = result.Item.latestRankingId;
      }

      if (!rankings[latestRankingId]) {
        return [];
      }

      const { recommendations } = rankings[latestRankingId];

      return recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
      return [];
    }
  }

  static async updateRecommendation(
    userId,
    categoryId,
    itemList,
    latestRankingId
  ) {
    try {
      const params = {
        TableName: RANKINGS_TABLE,
        Key: {
          categoryId,
          userId,
        },
        UpdateExpression:
          "SET rankings.#rankingId.recommendations = :newRecommendations",
        ExpressionAttributeNames: {
          "#rankingId": latestRankingId,
        },
        ExpressionAttributeValues: {
          ":newRecommendations": itemList,
        },
        ReturnValues: "UPDATED_NEW",
      };
      const response = await dynamoDB.update(params).promise();
      return response;
    } catch (error) {
      console.error(`Failed to write to DynamoDB: ${error}`);
      return null;
    }
  }
}

module.exports = Rankings;
