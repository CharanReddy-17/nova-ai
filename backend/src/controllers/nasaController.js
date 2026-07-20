const nasaService = require('../services/nasaService');

const getAPOD = async (req, res) => {
  try {
    const { date } = req.query;
    const data = await nasaService.getAPOD(date);
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'NASA data unavailable. Please try again later.' });
  }
};

const searchImages = async (req, res) => {
  try {
    const { q, count } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required.' });
    const images = await nasaService.searchImages(q, parseInt(count) || 6);
    res.json({ images });
  } catch (err) {
    res.status(503).json({ error: 'NASA image search unavailable.' });
  }
};

const getNEOs = async (req, res) => {
  try {
    const data = await nasaService.getNEOs();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Near-Earth Object data unavailable.' });
  }
};

const getMarsPhotos = async (req, res) => {
  try {
    const { rover, count } = req.query;
    const photos = await nasaService.getMarsPhotos(rover || 'curiosity', parseInt(count) || 6);
    res.json({ photos });
  } catch (err) {
    res.status(503).json({ error: 'Mars rover photos unavailable.' });
  }
};

const getExoplanetCount = async (req, res) => {
  try {
    const count = await nasaService.getExoplanetCount();
    res.json({ count });
  } catch (err) {
    res.status(503).json({ error: 'Exoplanet data unavailable.' });
  }
};

module.exports = { getAPOD, searchImages, getNEOs, getMarsPhotos, getExoplanetCount };
