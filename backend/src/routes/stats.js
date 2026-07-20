const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Chat = require('../models/Chat');

// @route GET /api/stats
// @desc  Get usage stats for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).select('messages title createdAt updatedAt');

    const totalChats = chats.length;
    let totalMessages = 0, totalUserMessages = 0, totalAIMessages = 0;
    let totalWords = 0;
    const dayMap = {};   // "YYYY-MM-DD" -> message count
    const wordFreq = {}; // word -> frequency (for topic cloud)

    const STOP_WORDS = new Set(['the','a','an','is','it','in','on','at','to','of','and','or','for','with','that','this','was','are','be','as','by','from','i','you','we','they','have','had','but','not','my','what','how','why','when','where','can','do','does','did','will','would','should','could','about','if','so','just','then','there','than','its','your','our','their','his','her','he','she','me','us','them']);

    for (const chat of chats) {
      totalMessages += chat.messages.length;

      for (const msg of chat.messages) {
        if (msg.role === 'user') {
          totalUserMessages++;
          const words = msg.content.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
          totalWords += words.length;
          words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
        } else {
          totalAIMessages++;
        }

        // Day bucketing
        const day = new Date(msg.timestamp || chat.createdAt).toISOString().slice(0, 10);
        dayMap[day] = (dayMap[day] || 0) + 1;
      }
    }

    // Activity: last 14 days
    const activity = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      activity.push({ date: key, count: dayMap[key] || 0 });
    }

    // Top topics (top 20 words by frequency)
    const topics = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    res.json({
      totalChats,
      totalMessages,
      totalUserMessages,
      totalAIMessages,
      totalWords,
      activity,
      topics,
      memberSince: req.user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

module.exports = router;
