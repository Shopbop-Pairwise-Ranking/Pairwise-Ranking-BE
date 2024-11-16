const { getUserByEmail, updateLastLogin } = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtils');
const { verifyPassword } = require('../utils/passwordUtils');

const login = async (req, res) => {
  console.log(process.env);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await getUserByEmail(email);
    console.log("fetched email");

    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    await updateLastLogin(email);
    const token = generateToken(user.email);

    return res.json({ token });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login
};
