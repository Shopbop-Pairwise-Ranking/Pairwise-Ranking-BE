const dynamoDB = require("../config/dynamoDBConfig");

const USERS_TABLE = process.env.USERS_TABLE;

class Users {
  static async getUserByEmail(email) {
    const params = {
      TableName: USERS_TABLE,
      Key: { email },
    };
    const result = await dynamoDB.get(params).promise();
    return result.Item;
  }

  static async updateLastLogin(email) {
    const params = {
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: "set lastLogin = :lastLogin",
      ExpressionAttributeValues: { ":lastLogin": new Date().toISOString() },
    };
    await dynamoDB.update(params).promise();
  }

  static async addUser(user) {
    const params = {
      TableName: USERS_TABLE,
      Item: user,
    };
    return await dynamoDB.put(params).promise();
  }
}

module.exports = Users;
