const { v4: uuidv4 } = require('uuid');
const dynamoDB = require('../config/dynamoDBConfig');
const RANKINGS_TABLE = process.env.RANKINGS_TABLE;

class Rankings {
    static async updateRanking(userId, categoryId, ranking) {
        const rankingId = uuidv4();
        const timestamp = new Date().toISOString();

        const getParams = {
            TableName: RANKINGS_TABLE,
            Key: { userId, categoryId }
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
                    '#rankings': 'rankings',
                    '#newRankingId': rankingId
                },
                ExpressionAttributeValues: {
                    ':newRanking': {
                        ranks: ranking,
                        timestamp,
                        recommendations: []
                    },
                    ':rankingId': rankingId
                }
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
                            recommendations: []
                        }
                    }
                }
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
}

module.exports = Rankings;
