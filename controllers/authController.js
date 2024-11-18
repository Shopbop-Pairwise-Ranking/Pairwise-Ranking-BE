const { getUserByEmail, updateLastLogin, addUser } = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtils');
const { verifyPassword, encryptPassword } = require('../utils/passwordUtils');
const { v4: uuidv4 } = require('uuid');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await getUserByEmail(email);

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

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
      const validateUser = await getUserByEmail(email);
      if (validateUser) {
        return res.status(409).json({error: 'Email already exists'});
      }

      const user = {
          userID: uuidv4(),
          name,
          email,
          passwordHash: encryptPassword(password),
          signupDate: new Date().toISOString()
      };
      await addUser(user);
      res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  signup
};
