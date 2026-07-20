const Chat = require('../models/Chat');
const aiService = require('../services/aiService');
const nasaService = require('../services/nasaService');

// Extract planet/object keyword from message to trigger 3D scene
const extractSpaceKeyword = (text) => {
  const keywords = [
    'mercury','venus','earth','mars','jupiter','saturn','uranus','neptune',
    'moon','sun','black hole','nebula','galaxy','asteroid','comet',
    'supernova','pulsar','quasar','neutron star','star','milky way',
    'andromeda','exoplanet','dwarf planet','pluto','titan','europa',
    'io','ganymede','rings of saturn','solar system',
  ];
  const lower = text.toLowerCase();
  return keywords.find(k => lower.includes(k)) || null;
};

// @route GET /api/chats
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select('title createdAt updatedAt isPinned')
      .sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chats.' });
  }
};

// @route POST /api/chats
const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await Chat.create({ userId: req.user._id, title: title || 'New Chat', messages: [] });
    res.status(201).json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat.' });
  }
};

// @route GET /api/chats/:id
const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chat.' });
  }
};

// @route PATCH /api/chats/:id
const updateChat = async (req, res) => {
  try {
    const { title, isPinned } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...(title && { title }), ...(isPinned !== undefined && { isPinned }) },
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update chat.' });
  }
};

// @route DELETE /api/chats/:id
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    res.json({ message: 'Chat deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat.' });
  }
};

// @route POST /api/chats/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    // Add user message
    chat.messages.push({ role: 'user', content });

    // Auto-title from first message
    if (chat.messages.length === 1 && chat.title === 'New Chat') {
      chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    // Get conversation history (last 20 messages for context)
    const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    // Call AI
    const aiResponse = await aiService.chat(history, req.user.preferences?.language || 'en');

    // Check if we need NASA images
    const keyword = extractSpaceKeyword(content);
    let nasaImages = [];
    if (keyword && content.toLowerCase().includes('show') || content.toLowerCase().includes('image') || content.toLowerCase().includes('photo')) {
      try {
        nasaImages = await nasaService.searchImages(keyword, 3);
      } catch (e) { /* silent fail */ }
    }

    // Add assistant message
    chat.messages.push({ role: 'assistant', content: aiResponse, nasaImages });
    await chat.save();

    res.json({
      message: { role: 'assistant', content: aiResponse, nasaImages, timestamp: new Date() },
      spaceKeyword: keyword, // Frontend uses this to switch 3D scene
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI service temporarily unavailable.' });
  }
};

module.exports = { getChats, createChat, getChat, updateChat, deleteChat, sendMessage };
