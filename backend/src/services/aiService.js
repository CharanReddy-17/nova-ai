const OpenAI = require('openai');

const useGroq = !!process.env.GROQ_API_KEY;

const client = useGroq
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_MODEL = useGroq ? 'llama-3.3-70b-versatile' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

// Allowed Groq models (whitelist to prevent abuse)
const ALLOWED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

console.log(`🤖 AI Provider: ${useGroq ? 'Groq (LLaMA 3.3 — Free)' : 'OpenAI'} | Model: ${DEFAULT_MODEL}`);

const SYSTEM_PROMPT = `You are NOVA AI, an intelligent assistant with deep knowledge across all domains.

You excel at:
- Science & astronomy (planets, stars, black holes, NASA missions, JWST discoveries)
- Programming & code (debugging, explaining, writing clean code in any language)
- Mathematics & problem solving (step-by-step explanations)
- Writing & creativity (essays, stories, summaries, brainstorming)
- General knowledge & research (facts, history, geography, current events)

Response style:
- Be accurate, clear, and engaging
- Use markdown formatting (bold, lists, code blocks, headers where appropriate)
- For code: always use proper code blocks with language syntax
- Keep responses concise but complete — don't pad unnecessarily
- Be friendly and conversational, not robotic`;

// Standard (non-streaming) chat
const chat = async (messages, language = 'en', model = null) => {
  const langInstruction = language !== 'en'
    ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;

  const response = await client.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + langInstruction },
      ...messages,
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// Streaming chat — returns async iterable of chunks
const chatStream = async (messages, language = 'en', model = null) => {
  const langInstruction = language !== 'en'
    ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;

  const stream = await client.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + langInstruction },
      ...messages,
    ],
    max_tokens: 1500,
    temperature: 0.7,
    stream: true,
  });

  return stream;
};

const analyzeImage = async (imageUrl, prompt = '') => {
  if (useGroq) return 'Image analysis — upload your image and ask NOVA AI about it!';
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: prompt || 'Analyze this image and describe what you see.' },
      ],
    }],
    max_tokens: 512,
  });
  return response.choices[0].message.content;
};

const getLanguageName = (code) => {
  const map = { hi: 'Hindi', te: 'Telugu', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese' };
  return map[code] || 'English';
};

module.exports = { chat, chatStream, analyzeImage, ALLOWED_MODELS, DEFAULT_MODEL };
