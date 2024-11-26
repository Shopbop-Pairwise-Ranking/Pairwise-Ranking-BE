require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = '/api';

app.use(cors());
app.use(bodyParser.json());

const imagesRoutes = require('./routes/images');
app.use(API_BASE, imagesRoutes);

const authRoutes = require('./routes/authRoute');
app.use(API_BASE, authRoutes);

const rankingRoutes = require('./routes/rankingRoute');
app.use(API_BASE, rankingRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
