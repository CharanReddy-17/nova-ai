const mongoose = require('mongoose');

const uploadedImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true }, // Cloudinary public ID for deletion
  filename: String,
  analysis: String, // AI-generated analysis text
  tags: [String],
  size: Number, // bytes
}, { timestamps: true });

module.exports = mongoose.model('UploadedImage', uploadedImageSchema);
