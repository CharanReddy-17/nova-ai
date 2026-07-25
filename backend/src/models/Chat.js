const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});


const chatSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, default: 'New Chat', maxlength: 100 },
  messages: [messageSchema],
  isPinned: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  shareId:  { type: String, default: null, index: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
