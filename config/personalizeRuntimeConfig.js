const AWS = require('aws-sdk');

// Configure AWS Personalize Runtime
const personalizeRuntime = new AWS.PersonalizeRuntime({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

module.exports = personalizeRuntime;
