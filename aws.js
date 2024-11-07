const AWS = require('aws-sdk');

// Set up DynamoDB with credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your secret key
  region: 'us-west-2', // Your DynamoDB region
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
