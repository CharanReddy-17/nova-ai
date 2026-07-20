const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { uploadImage, getUserImages, deleteImage, reanalyzeImage } = require('../controllers/uploadController');

router.use(protect);
router.post('/', upload.single('image'), uploadImage);
router.get('/', getUserImages);
router.delete('/:id', deleteImage);
router.post('/:id/analyze', reanalyzeImage);

module.exports = router;
