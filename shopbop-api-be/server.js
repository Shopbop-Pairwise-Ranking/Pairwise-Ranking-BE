// server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Routes
const imagesRoutes = require('./routes/images');
app.use('/api', imagesRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
