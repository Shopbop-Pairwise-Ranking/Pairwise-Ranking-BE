const express = require('express');
const { login } = require('../controllers/authController');

const router = express.Router();
router.post('/login', login);

console.log("hi")
module.exports = router;
