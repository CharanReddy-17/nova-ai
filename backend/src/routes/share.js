const express = require('express');
const router  = express.Router();
const Chat    = require('../models/Chat');

// ── Dynamically import nanoid (ESM) ──────────────────────────────────────────
let nanoidFn;
const getNanoid = async () => {
  if (!nanoidFn) {
    const { nanoid } = await import('nanoid');
    nanoidFn = nanoid;
  }
  return nanoidFn;
};

// @route  GET /api/share/:shareId  (PUBLIC — no auth)
// Returns only what is needed for the public share page
router.get('/:shareId', async (req, res) => {
  try {
    const chat = await Chat.findOne({ shareId: req.params.shareId, isPublic: true })
      .select('title messages createdAt shareId');
    if (!chat) return res.status(404).json({ error: 'Shared conversation not found or link has been disabled.' });

    // Strip any sensitive content — only return role + content + timestamp
    const messages = chat.messages.map(m => ({
      role:      m.role,
      content:   m.content,
      timestamp: m.timestamp,
    }));

    res.json({ title: chat.title, messages, createdAt: chat.createdAt, shareId: chat.shareId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load shared conversation.' });
  }
});

module.exports = router;
