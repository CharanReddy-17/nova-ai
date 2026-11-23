const OpenAI = require('openai');

const useGroq = !!process.env.GROQ_API_KEY;

const client = useGroq
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Active Groq models
const DEFAULT_MODEL = useGroq ? 'openai/gpt-oss-120b' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

const ALLOWED_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

console.log(`🤖 AI Provider: ${useGroq ? 'Groq' : 'OpenAI'} | Default Model: ${DEFAULT_MODEL}`);

const BASE_PROMPT = `You are NOVA AI, a brilliant and versatile AI assistant.

You excel at:
- Programming & code (debugging, code review, explaining, writing clean code in any language)
- Mathematics & problem solving (step-by-step, clear reasoning)
- Writing & creativity (essays, stories, summaries, editing, brainstorming)
- Research & knowledge (history, science, geography, current events, facts)
- Analysis & reasoning (breaking down complex topics, pros/cons, comparisons)

Response style:
- Be accurate, clear, and genuinely helpful
- Use markdown formatting: **bold** for key terms, lists for steps/options, code blocks for code
- For code: always use proper fenced code blocks with the language identifier
- Keep responses concise but complete — never pad unnecessarily
- Be warm and conversational, not robotic or stiff`;

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

const SYSTEM_PROMPT = BASE_PROMPT;

// Standard (non-streaming) chat with fallback
const chat = async (messages, language = 'en', model = null, persona = null) => {
  const langInstruction = language !== 'en' ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;
  const systemPrompt = (persona && PERSONAS[persona]) ? PERSONAS[persona] : SYSTEM_PROMPT;

  const tryCall = async (targetModel) => {
    const response = await client.chat.completions.create({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt + langInstruction },
        ...messages,
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  };

  try {
    return await tryCall(selectedModel);
  } catch (err) {
    console.warn(`[chat] Model ${selectedModel} failed (${err.message}). Falling back to ${DEFAULT_MODEL}...`);
    if (selectedModel !== DEFAULT_MODEL) {
      return await tryCall(DEFAULT_MODEL);
    }
    // Fallback to alternative model if default fails
    return await tryCall('qwen/qwen3.8-27b');
  }
};

// Streaming chat with fallback
const chatStream = async (messages, language = 'en', model = null, persona = null) => {
  const langInstruction = language !== 'en' ? ` Please respond in ${getLanguageName(language)}.` : '';
  const selectedModel = (model && ALLOWED_MODELS.includes(model)) ? model : DEFAULT_MODEL;
  const systemPrompt = (persona && PERSONAS[persona]) ? PERSONAS[persona] : SYSTEM_PROMPT;

  const tryStream = async (targetModel) => {
    return await client.chat.completions.create({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt + langInstruction },
        ...messages,
      ],
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    });
  };

  try {
    return await tryStream(selectedModel);
  } catch (err) {
    console.warn(`[chatStream] Model ${selectedModel} failed (${err.message}). Falling back to ${DEFAULT_MODEL}...`);
    if (selectedModel !== DEFAULT_MODEL) {
      return await tryStream(DEFAULT_MODEL);
    }
    return await tryStream('qwen/qwen3.8-27b');
  }
};

const analyzeImage = async (imageUrl, prompt = '') => {
  return 'Image analysis received. Ask NOVA AI any question about the uploaded image.';
};

const getLanguageName = (code) => {
  const map = { hi: 'Hindi', te: 'Telugu', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese' };
  return map[code] || 'English';
};

module.exports = { chat, chatStream, analyzeImage, ALLOWED_MODELS, DEFAULT_MODEL, PERSONAS };
