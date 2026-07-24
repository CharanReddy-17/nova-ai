const Chat = require('../models/Chat');
const aiService = require('../services/aiService');

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

// @route POST /api/chats/:id/generate-title
// Asks AI to summarise the first exchange into a short title
const generateTitle = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const firstUser = chat.messages.find(m => m.role === 'user')?.content || '';
    const firstAI   = chat.messages.find(m => m.role === 'assistant')?.content || '';

    if (!firstUser) return res.json({ title: chat.title });

    const prompt = [
      { role: 'user', content: `Generate a short chat title (max 5 words, no quotes) that captures the topic of this conversation:\nUser: ${firstUser.slice(0, 200)}\nAI: ${firstAI.slice(0, 200)}` },
    ];
    const title = await aiService.chat(prompt, 'en', null, null);
    const cleaned = title.replace(/^["']|["']$/g, '').trim().slice(0, 60);

    await Chat.findByIdAndUpdate(chat._id, { title: cleaned });
    res.json({ title: cleaned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate title.' });
  }
};

// @route POST /api/chats/:id/messages (non-streaming fallback)
const sendMessage = async (req, res) => {
  try {
    const { content, model, persona } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

    // Daily limit check
    const UserModel = require('../models/User');
    const freshUser = await UserModel.findById(req.user._id);
    freshUser.resetDailyCountIfNeeded();
    if (freshUser.isAtLimit()) {
      return res.status(429).json({ error: 'Daily limit reached', code: 'LIMIT_REACHED', plan: 'free', limit: 50 });
    }

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    chat.messages.push({ role: 'user', content });
    const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    const aiResponse = await aiService.chat(history, req.user.preferences?.language || 'en', model || null, persona || null);

    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();
    freshUser.dailyMessageCount += 1;
    await freshUser.save();

    res.json({
      message: { role: 'assistant', content: aiResponse, timestamp: new Date() },
      usage: { count: freshUser.dailyMessageCount, limit: 50, plan: freshUser.plan },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI service temporarily unavailable.' });
  }
};

// @route POST /api/chats/:id/messages/stream
const streamMessage = async (req, res) => {
  try {
    const { content, model, persona } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

    // Daily limit check
    const UserModel = require('../models/User');
    const freshUser = await UserModel.findById(req.user._id);
    freshUser.resetDailyCountIfNeeded();
    if (freshUser.isAtLimit()) {
      return res.status(429).json({ error: 'Daily limit reached', code: 'LIMIT_REACHED', plan: 'free', limit: 50 });
    }

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    chat.messages.push({ role: 'user', content });
    const isFirstMessage = chat.messages.length === 1;

    const history = chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Stream AI response
    const stream = await aiService.chatStream(history, req.user.preferences?.language || 'en', model || null, persona || null);
    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
      }
    }

    // Save to DB
    chat.messages.push({ role: 'assistant', content: fullResponse });
    await chat.save();
    freshUser.dailyMessageCount += 1;
    await freshUser.save();

    // Signal completion — include isFirstMessage so client can auto-generate title
    res.write(`event: done\ndata: ${JSON.stringify({ title: chat.title, isFirstMessage })}\n\n`);
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

module.exports = { getChats, createChat, getChat, updateChat, deleteChat, sendMessage, streamMessage, generateTitle };
