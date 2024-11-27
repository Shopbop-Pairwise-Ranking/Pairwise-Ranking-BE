const dynamoDB = require('../config/dynamoDBConfig');
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

class Products {
    static async getProducts(productIds) {
        const params = {
            RequestItems: {
                [PRODUCTS_TABLE]: {
                    Keys: productIds.map(id => ({ productSin: id }))
                }
            }
        };
        const result = await dynamoDB.batchGet(params).promise();
        return result.Responses[PRODUCTS_TABLE] || [];
    }

   static async getProductsByCateogryAndGender(category, gender) {
        const params = {
          TableName: PRODUCTS_TABLE,
          FilterExpression: 'categoryID = :category AND gender = :gender',
          ExpressionAttributeValues: {
            ':category': category,
            ':gender': gender.toUpperCase(),
          },
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items || [];
      }

    static async updateProductRating(productSin, newEloRating, isWinner) {
        const updateExpressionParts = [
            'eloRating = :eloRating'
        ];
        const expressionAttributeValues = {
            ':eloRating': newEloRating,
            ':zero': 0
        };

        if (isWinner) {
            updateExpressionParts.push('wins = if_not_exists(wins, :zero) + :winIncrement');
            expressionAttributeValues[':winIncrement'] = 1;
        } else {
            updateExpressionParts.push('losses = if_not_exists(losses, :zero) + :lossIncrement');
            expressionAttributeValues[':lossIncrement'] = 1;
        }

        const params = {
            TableName: PRODUCTS_TABLE,
            Key: { productSin },
            UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues
        };

        return dynamoDB.update(params).promise();
    }
}

module.exports = Products;