const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who triggered it
  chatId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  messageText:{ type: String }, // small excerpt of the message
  messageAt:  { type: Date, default: Date.now },
  type:       { type: String, enum: ['mention'], default: 'mention' },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
