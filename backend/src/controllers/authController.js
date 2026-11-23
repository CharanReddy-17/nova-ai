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

// @desc   Reset password
// @route  POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({
      message: 'Password reset successful! You can now log in.',
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Password reset failed.' });
  }
};

module.exports = { register, login, getMe, updatePreferences, resetPassword };
