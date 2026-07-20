const multer = require('multer');
const path = require('path');
const os = require('os');

// ── Cloudinary (optional – only active when real credentials provided) ──
let cloudinary = null;
let storage;

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder';

if (hasCloudinary) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'cosmic-explorer',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
      },
    });
    console.log('☁️  Cloudinary storage active');
  } catch (err) {
    console.warn('⚠️  Cloudinary init failed, falling back to disk storage:', err.message);
    cloudinary = null;
  }
}

// Fallback: save to temp directory
if (!storage) {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });
  console.log('💾  Using local disk storage for uploads (Cloudinary not configured)');
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Use JPG, PNG, or WebP.'), false);
    }
  },
});

module.exports = { cloudinary, upload, hasCloudinary };
