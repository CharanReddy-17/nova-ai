const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6,
  },
  preferences: {
    theme:    { type: String,  default: 'dark' },
    language: { type: String,  default: 'en'   },
    voice:    { type: Boolean, default: true    },
  },

  // ── Plan / Billing ─────────────────────────────────────────────────────────
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  stripeCustomerId:     { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },

  // ── Daily usage tracking ───────────────────────────────────────────────────
  dailyMessageCount: { type: Number, default: 0 },
  messageResetDate:  { type: Date,   default: Date.now },

  uploadCount:     { type: Number, default: 0 },
  uploadResetDate: { type: Date,   default: Date.now },
}, { timestamps: true });

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ── Reset daily count if it's a new day ───────────────────────────────────────
userSchema.methods.resetDailyCountIfNeeded = function () {
  const now = new Date();
  const reset = new Date(this.messageResetDate);
  if (now.toDateString() !== reset.toDateString()) {
    this.dailyMessageCount = 0;
    this.messageResetDate = now;
  }
};

// ── Limits per plan ───────────────────────────────────────────────────────────
userSchema.methods.getDailyLimit = function () {
  return this.plan === 'pro' ? Infinity : 50;
};

userSchema.methods.isAtLimit = function () {
  this.resetDailyCountIfNeeded();
  return this.plan === 'free' && this.dailyMessageCount >= 50;
};

module.exports = mongoose.model('User', userSchema);
