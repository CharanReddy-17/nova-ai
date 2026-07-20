const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAPOD, searchImages, getNEOs, getMarsPhotos, getExoplanetCount } = require('../controllers/nasaController');

router.get('/apod', protect, getAPOD);
router.get('/images', protect, searchImages);
router.get('/neo', protect, getNEOs);
router.get('/mars', protect, getMarsPhotos);
router.get('/exoplanets', protect, getExoplanetCount);

module.exports = router;
