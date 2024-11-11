require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const imagesRoutes = require('./routes/images');
app.use('/api', imagesRoutes);

const DATA_FILE = path.join(__dirname, 'data', 'rankings.json');

// ELO rating function
const calculateElo = (ratingA, ratingB, result) => {
  const K = 32; // ELO adjustment factor
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedScoreB = 1 - expectedScoreA;

  const newRatingA = Math.round(ratingA + K * (result - expectedScoreA));
  const newRatingB = Math.round(ratingB + K * ((1 - result) - expectedScoreB));

  return { newRatingA, newRatingB };
};

// Function to read data from JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data:', err);
    return { ShopbopRankings: [] };
  }
};

// Function to write data to JSON file
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data:', err);
  }
};

// POST API for comparisons
app.post('/submitComparison', (req, res) => {
  const { userId, categoryId, itemA, itemB, winner } = req.body;

  if (!userId || !categoryId || !itemA || !itemB || !winner) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const data = readData();

  // Find the user ranking for the given userId and categoryId, if it exists
  let userRanking = data.ShopbopRankings.find(
    (rank) => rank.UserID === userId && rank.CategoryID === categoryId
  );

  // If user ranking does not exist, create a new one
  if (!userRanking) {
    userRanking = {
      UserID: userId,
      CategoryID: categoryId,
      Rankings: {},
      Timestamp: new Date().toISOString(),
    };
    data.ShopbopRankings.push(userRanking);
  }

  // Get current ratings or initialize them to 1000 if they do not exist
  let ratingA = userRanking.Rankings[itemA] || 1000;
  let ratingB = userRanking.Rankings[itemB] || 1000;

  // Calculate new ratings based on the winner
  const result = winner === itemA ? 1 : 0;
  const { newRatingA, newRatingB } = calculateElo(ratingA, ratingB, result);

  // Update the ratings in the user's rankings
  userRanking.Rankings[itemA] = newRatingA;
  userRanking.Rankings[itemB] = newRatingB;
  userRanking.Timestamp = new Date().toISOString();

  // Write the updated data back to the file
  writeData(data);

  res.status(200).json({
    message: 'Comparison submitted successfully!',
    updatedRatings: {
      [itemA]: newRatingA,
      [itemB]: newRatingB,
    },
  });
});

// Endpoint to get average rankings for a category
app.get('/rankings/:categoryId', (req, res) => {
  const { categoryId } = req.params;

  const data = readData(); // Read the JSON file with all rankings
  const rankings = {};  // To accumulate scores
  const counts = {};    // To track how many users ranked each item

  data.ShopbopRankings
    .filter((rank) => rank.CategoryID === categoryId)
    .forEach((rank) => {
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
    .map(([itemId, totalScore]) => {
      const averageScore = totalScore / counts[itemId];
      return { ItemID: itemId, AverageScore: averageScore };
    })
    .sort((a, b) => b.AverageScore - a.AverageScore);

  res.status(200).json({ rankings: averageRankings });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
