const Chat = require('../models/Chat');
const aiService = require('../services/aiService');
const nasaService = require('../services/nasaService');

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

// @route POST /api/chats/:id/messages (non-streaming fallback)
const sendMessage = async (req, res) => {
  try {
    const { content, model } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    chat.messages.push({ role: 'user', content });
    if (chat.messages.length === 1 && chat.title === 'New Chat') {
      chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    const aiResponse = await aiService.chat(history, req.user.preferences?.language || 'en', model || null);

    const keyword = extractSpaceKeyword(content);
    let nasaImages = [];
    if (keyword && (content.toLowerCase().includes('show') || content.toLowerCase().includes('image') || content.toLowerCase().includes('photo'))) {
      try { nasaImages = await nasaService.searchImages(keyword, 3); } catch (e) {}
    }

    chat.messages.push({ role: 'assistant', content: aiResponse, nasaImages });
    await chat.save();

    res.json({
      message: { role: 'assistant', content: aiResponse, nasaImages, timestamp: new Date() },
      spaceKeyword: keyword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI service temporarily unavailable.' });
  }
};

// @route POST /api/chats/:id/messages/stream  ← NEW STREAMING ENDPOINT
const streamMessage = async (req, res) => {
  try {
    const { content, model } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    // Add user message
    chat.messages.push({ role: 'user', content });
    if (chat.messages.length === 1 && chat.title === 'New Chat') {
      chat.title = content.slice(0, 50) + (content.length > 50 ? '…' : '');
    }

    const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Important for Nginx/Render proxies
    res.flushHeaders();

    // Send space keyword early so UI can update 3D viewer immediately
    const keyword = extractSpaceKeyword(content);
    if (keyword) {
      res.write(`event: meta\ndata: ${JSON.stringify({ spaceKeyword: keyword, title: chat.title })}\n\n`);
    }

    // Stream AI response
    const stream = await aiService.chatStream(history, req.user.preferences?.language || 'en', model || null);
    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
      }
    }

    // Save complete message to DB
    chat.messages.push({ role: 'assistant', content: fullResponse });
    await chat.save();

    // Signal completion
    res.write(`event: done\ndata: ${JSON.stringify({ spaceKeyword: keyword, title: chat.title })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed.' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

module.exports = { getChats, createChat, getChat, updateChat, deleteChat, sendMessage, streamMessage };
