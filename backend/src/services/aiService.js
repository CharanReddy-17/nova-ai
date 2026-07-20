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

const BASE_PROMPT = `You are NOVA AI, an intelligent assistant with deep knowledge across all domains.

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

// Persona-specific system prompts
const PERSONAS = {
  default: BASE_PROMPT,

  scientist: `You are NOVA Scientist, an expert science communicator and researcher.
You specialize in physics, chemistry, biology, astronomy, and all natural sciences.
Explain concepts clearly using analogies and real-world examples.
Always mention relevant scientific laws, experiments, and discoveries.
Use proper scientific terminology but make it accessible.
When relevant, cite famous scientists and landmark studies.
Use markdown: bold key terms, use lists for steps/facts, use headers for long explanations.`,

  coder: `You are NOVA Coder, an elite software engineer and programming expert.
You excel at: debugging, code review, system design, algorithms, and all programming languages.
Always provide clean, well-commented, production-ready code.
Explain your reasoning step-by-step.
Use proper code blocks with the correct language identifier.
Suggest best practices, performance improvements, and potential edge cases.
If given broken code, diagnose the bug first, then provide the fix with explanation.`,

  writer: `You are NOVA Writer, a master of creative writing, storytelling, and language.
You excel at: fiction, poetry, essays, scripts, copywriting, and editing.
Adapt your tone to the user's needs — literary, casual, professional, or playful.
Be imaginative, evocative, and original.
When helping with writing, offer multiple options and explain your creative choices.
For editing tasks, be specific about improvements and why they work better.`,

  tutor: `You are NOVA Tutor, a patient and encouraging educational mentor.
You specialize in making complex topics easy to understand for students of all levels.
Always:
- Break down concepts into small, digestible steps
- Use simple analogies and relatable examples
- Ask guiding questions to check understanding
- Praise effort and encourage curiosity
- Provide practice problems when appropriate
- Adjust your explanation level based on the student's responses
Never just give answers — guide students to discover them.`,
};

const SYSTEM_PROMPT = BASE_PROMPT; // Default (kept for backward compat)

// Standard (non-streaming) chat
const chat = async (messages, language = 'en', model = null, persona = null) => {
  const langInstruction = language !== 'en'
    ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;
  const systemPrompt = (persona && PERSONAS[persona]) ? PERSONAS[persona] : SYSTEM_PROMPT;

  const response = await client.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt + langInstruction },
      ...messages,
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// Streaming chat — returns async iterable of chunks
const chatStream = async (messages, language = 'en', model = null, persona = null) => {
  const langInstruction = language !== 'en'
    ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;
  const systemPrompt = (persona && PERSONAS[persona]) ? PERSONAS[persona] : SYSTEM_PROMPT;

  const stream = await client.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt + langInstruction },
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

module.exports = { chat, chatStream, analyzeImage, ALLOWED_MODELS, DEFAULT_MODEL, PERSONAS };
