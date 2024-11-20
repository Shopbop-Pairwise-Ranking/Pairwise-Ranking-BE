require('dotenv').config();
const dynamoDb = require('./config/dynamoDBConfig');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
const TABLE_NAME = 'RankingsData';

const imagesRoutes = require('./routes/images');
app.use('/api', imagesRoutes);

const authRoutes = require('./routes/authRoute');
app.use('/api', authRoutes);

// ELO rating function
const calculateElo = (ratingA, ratingB, result) => {
  const K = 32;
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedScoreB = 1 - expectedScoreA;

  const newRatingA = Math.round(ratingA + K * (result - expectedScoreA));
  const newRatingB = Math.round(ratingB + K * ((1 - result) - expectedScoreB));

  return { newRatingA, newRatingB };
};

// Function to get user ranking from DynamoDB
const getUserRanking = async (userId, categoryId) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { UserID: userId, CategoryID: categoryId },
  };
  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || { Rankings: {} };
  } catch (err) {
    console.error('Error fetching user ranking:', err);
    return null;
  }
};

// Function to write user ranking to DynamoDB
const writeUserRanking = async (userRanking) => {
  const params = {
    TableName: TABLE_NAME,
    Item: userRanking,
  };
  try {
    await dynamoDb.put(params).promise();
  } catch (err) {
    console.error('Error writing user ranking:', err);
  }
};

// POST API for comparisons
app.post('/submitComparison', async (req, res) => {
  const { userId, categoryId, itemA, itemB, winner } = req.body;

  if (!userId || !categoryId || !itemA || !itemB || !winner) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Get existing user ranking from DynamoDB
  let userRanking = await getUserRanking(userId, categoryId);
  userRanking.UserID = userId;
  userRanking.CategoryID = categoryId;
  userRanking.Timestamp = new Date().toISOString();

  // Get current ratings or initialize to 1000
  let ratingA = userRanking.Rankings[itemA] || 1000;
  let ratingB = userRanking.Rankings[itemB] || 1000;

  // Calculate new ratings based on the winner
  const result = winner === itemA ? 1 : 0;
  const { newRatingA, newRatingB } = calculateElo(ratingA, ratingB, result);

  // Update the ratings
  userRanking.Rankings[itemA] = newRatingA;
  userRanking.Rankings[itemB] = newRatingB;

  // Write updated ranking back to DynamoDB
  await writeUserRanking(userRanking);

  res.status(200).json({
    message: 'Comparison submitted successfully!',
    updatedRatings: {
      [itemA]: newRatingA,
      [itemB]: newRatingB,
    },
  });
});

// Endpoint to get average rankings for a category
app.get('/rankings/:categoryId', async (req, res) => {
  const { categoryId } = req.params;

  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'CategoryID = :categoryId',
    ExpressionAttributeValues: { ':categoryId': categoryId },
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    const rankings = {};
    const counts = {};

    data.Items.forEach((rank) => {
      for (const [itemId, score] of Object.entries(rank.Rankings)) {
        if (!rankings[itemId]) {
          rankings[itemId] = score;
          counts[itemId] = 1;
        } else {
          rankings[itemId] += score;
          counts[itemId] += 1;
        }
      }
    });

    // Calculate the average score for each item
    const averageRankings = Object.entries(rankings)
      .map(([itemId, totalScore]) => ({
        ItemID: itemId,
        AverageScore: totalScore / counts[itemId],
      }))
      .sort((a, b) => b.AverageScore - a.AverageScore);

    res.status(200).json({ rankings: averageRankings });
  } catch (err) {
    console.error('Error fetching rankings:', err);
    res.status(500).json({ error: 'Could not retrieve rankings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
