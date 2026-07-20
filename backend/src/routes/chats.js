const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChats, createChat, getChat, updateChat, deleteChat, sendMessage } = require('../controllers/chatController');

router.use(protect);
router.get('/', getChats);
router.post('/', createChat);
router.get('/:id', getChat);
router.patch('/:id', updateChat);
router.delete('/:id', deleteChat);
router.post('/:id/messages', sendMessage);

module.exports = router;
