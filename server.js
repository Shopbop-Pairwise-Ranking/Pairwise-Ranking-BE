require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = '/api';

app.use(cors());
app.use(bodyParser.json());
app.use(API_BASE, require('./routes/authRoute'));
app.use(API_BASE, require('./routes/rankingRoute'));
app.use(API_BASE, require('./routes/productRoute'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
