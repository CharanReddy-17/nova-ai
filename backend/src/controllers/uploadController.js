const UploadedImage = require('../models/UploadedImage');
const { cloudinary, hasCloudinary } = require('../config/cloudinary');
const aiService = require('../services/aiService');
const fs = require('fs');

const DAILY_UPLOAD_LIMIT = 10;

// @route POST /api/uploads
const uploadImage = async (req, res) => {
  try {
    // Check daily upload limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await UploadedImage.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: today },
    });

    if (todayCount >= DAILY_UPLOAD_LIMIT) {
      return res.status(429).json({ error: `You've reached today's upload limit of ${DAILY_UPLOAD_LIMIT} images.` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    // Determine URL – Cloudinary gives req.file.path as HTTPS URL,
    // disk storage gives local path. Build a usable URL either way.
    let fileUrl = req.file.path;
    let publicId = req.file.filename || req.file.public_id || '';

    // If using Cloudinary, req.file.path is already the CDN URL
    if (hasCloudinary && req.file.secure_url) {
      fileUrl = req.file.secure_url;
      publicId = req.file.public_id;
    }

    // Run AI image analysis
    let analysis = 'Image uploaded successfully. AI analysis is only available when using Cloudinary with a URL-accessible image.';
    try {
      if (hasCloudinary && fileUrl.startsWith('http')) {
        analysis = await aiService.analyzeImage(fileUrl);
      }
    } catch (e) { /* silent – don't block upload */ }

    const image = await UploadedImage.create({
      userId: req.user._id,
      url: fileUrl,
      publicId,
      filename: req.file.originalname,
      analysis,
      size: req.file.size,
    });

    res.status(201).json({ image });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Image upload failed.' });
  }
};

// @route GET /api/uploads
const getUserImages = async (req, res) => {
  try {
    const images = await UploadedImage.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve images.' });
  }
};

// @route DELETE /api/uploads/:id
const deleteImage = async (req, res) => {
  try {
    const image = await UploadedImage.findOne({ _id: req.params.id, userId: req.user._id });
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    // Only delete from Cloudinary if configured and publicId exists
    if (hasCloudinary && cloudinary && image.publicId) {
      try { await cloudinary.uploader.destroy(image.publicId); } catch (e) { /* silent */ }
    }
    await image.deleteOne();

    res.json({ message: 'Image deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image.' });
  }
};

// @route POST /api/uploads/:id/analyze
const reanalyzeImage = async (req, res) => {
  try {
    const image = await UploadedImage.findOne({ _id: req.params.id, userId: req.user._id });
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    const analysis = await aiService.analyzeImage(image.url, req.body.prompt);
    image.analysis = analysis;
    await image.save();

    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI image analysis failed.' });
  }
};

module.exports = { uploadImage, getUserImages, deleteImage, reanalyzeImage };
