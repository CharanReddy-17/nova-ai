const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc   Register user
// @route  POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }
    const user = await User.create({ username, email, passwordHash: password });
    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    res.json({
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
};

// @desc   Get current user
// @route  GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username, email: req.user.email, preferences: req.user.preferences } });
};

// @desc   Update user preferences
// @route  PATCH /api/auth/preferences
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: { ...req.user.preferences, ...req.body } },
      { new: true }
    ).select('-passwordHash');
    res.json({ preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
};

module.exports = { register, login, getMe, updatePreferences };
