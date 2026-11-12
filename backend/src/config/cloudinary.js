const multer = require('multer');
const path   = require('path');
const os     = require('os');

// ── Cloudinary (optional – images only) ──────────────────────────────────────
let cloudinary  = null;
let imgStorage;

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder';

if (hasCloudinary) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    imgStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder:            'nova-ai',
        allowed_formats:   ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation:    [{ width: 1920, height: 1080, crop: 'limit' }],
      },
    });
    console.log('☁️  Cloudinary storage active');
  } catch (err) {
    console.warn('⚠️  Cloudinary init failed, falling back to disk:', err.message);
    cloudinary = null;
  }
}

// Disk storage — used for all non-image files AND images when Cloudinary absent
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

// ── Allowed MIME types (all categories) ──────────────────────────────────────
const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
]);

const ALLOWED_MIMES = new Set([
  // Images
  ...IMAGE_MIMES,
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text & code
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'text/typescript',
  'text/markdown',
  'text/csv',
  'text/xml',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-python',
  'application/x-sh',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  // Audio (Groq Whisper)
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/m4a',
  // Video (metadata only)
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

// ── Image-only upload (used for /imagine & profile pics) ─────────────────────
const upload = multer({
  storage: hasCloudinary && imgStorage ? imgStorage : diskStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are accepted here.'), false);
  },
});

// ── Universal upload (any allowed type) ───────────────────────────────────────
// Always disk — we extract text then delete; images are Cloudinary-uploaded
// separately in the controller if configured.
const uploadAny = multer({
  storage: diskStorage,
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50 MB (audio needs more room)
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  },
});

module.exports = { cloudinary, upload, uploadAny, hasCloudinary, IMAGE_MIMES };
