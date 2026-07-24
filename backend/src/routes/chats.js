const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getChats, createChat, getChat, updateChat, deleteChat,
  sendMessage, streamMessage, generateTitle,
} = require('../controllers/chatController');

router.use(protect);
router.get('/',    getChats);
router.post('/',   createChat);
router.get('/:id',    getChat);
router.patch('/:id',  updateChat);
router.delete('/:id', deleteChat);

router.post('/:id/messages',        sendMessage);   // non-streaming fallback
router.post('/:id/messages/stream', streamMessage); // SSE streaming
router.post('/:id/generate-title',  generateTitle); // AI-generated title

module.exports = router;
