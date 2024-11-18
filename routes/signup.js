const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');

AWS.config.update({
    accessKeyId: 'AKIAQUFLQI26KKN7T2PN',       // Replace with your actual Access Key ID
    secretAccessKey: 'ihmJI7CTkQVERZw81V1nSrD0fBE57Gt/JQaiKbTC', // Replace with your actual Secret Access Key
    region: 'us-east-2'                       // Replace with your AWS region
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = "Users"; 


async function userExists(email) {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            email: email
        }
    };

    try {
        const result = await dynamoDb.get(params).promise();
        // If an item is returned, the email exists
        return result.Item ? true : false;
    } catch (error) {
        console.error("Error checking user existence:", error);
        throw new Error("Could not verify user existence");
    }
}


async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function addUser(user) {
    const params = {
        TableName: USERS_TABLE,
        Item: user
    };
    return await dynamoDb.put(params).promise();
}

async function signupUser(username, email, password) {
    if (await userExists(email)) {
        throw new Error('Username or email already in use');
    }
    const passwordHash = await hashPassword(password);
    const userId = `user_${Date.now()}`; 
    const user = {
        userID: userId,
        username: username,
        email: email,
        passwordHash: passwordHash,
        signupDate: new Date().toISOString()
    };

    await addUser(user);
    return userId;
}

module.exports = {
    signupUser
};
