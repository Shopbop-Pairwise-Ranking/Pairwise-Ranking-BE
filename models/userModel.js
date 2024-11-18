const dynamoDb = require('../config/dynamoDBConfig');

const USERS_TABLE = process.env.USERS_TABLE;

const getUserByEmail = async (email) => {
  const params = {
    TableName: USERS_TABLE,
    Key: { email }
  };
  const result = await dynamoDb.get(params).promise();
  return result.Item;
};

const updateLastLogin = async (email) => {
  const params = {
    TableName: USERS_TABLE,
    Key: { email },
    UpdateExpression: 'set lastLogin = :lastLogin',
    ExpressionAttributeValues: { ':lastLogin': new Date().toISOString() }
  };
  await dynamoDb.update(params).promise();
};

async function addUser(user) {
  const params = {
      TableName: USERS_TABLE,
      Item: user
  };
  return await dynamoDb.put(params).promise();
}

module.exports = {
  getUserByEmail,
  updateLastLogin,
  addUser,
};
