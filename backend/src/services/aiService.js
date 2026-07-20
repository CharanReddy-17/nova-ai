const OpenAI = require('openai');

// Groq is OpenAI-compatible — just change baseURL and model
// Falls back to OpenAI if GROQ_API_KEY is not set
const useGroq = !!process.env.GROQ_API_KEY;

const client = useGroq
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_MODEL = useGroq ? 'llama-3.3-70b-versatile' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

console.log(`🤖 AI Provider: ${useGroq ? 'Groq (LLaMA 3 — Free)' : 'OpenAI'} | Model: ${DEFAULT_MODEL}`);

const SYSTEM_PROMPT = `You are Cosmic Explorer AI, an expert astronomy assistant powered by NASA data and cutting-edge astrophysics knowledge.

You specialize in:
- Solar system planets, moons, asteroids, and comets
- Stars, stellar evolution, nebulae, and galaxies
- Black holes, neutron stars, quasars, and pulsars
- Space missions (NASA, ESA, SpaceX, ISRO, etc.)
- James Webb Space Telescope discoveries
- Cosmology and the origin of the universe
- Exoplanets and the search for life
- Space technology and instrumentation

Response style:
- Be accurate, engaging, and educational
- Use markdown formatting (bold, lists, headers where appropriate)
- When explaining complex concepts, use analogies
- Mention relevant NASA missions and recent discoveries
- Keep responses concise but complete (2-4 paragraphs max unless asked for more)
- If asked to show something visually, mention you're triggering the 3D visualization`;

const chat = async (messages, language = 'en') => {
  const langInstruction = language !== 'en'
    ? ` Please respond in ${getLanguageName(language)}.`
    : '';

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + langInstruction },
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

const analyzeImage = async (imageUrl, prompt = '') => {
  // Image analysis only available with OpenAI vision models
  if (useGroq) {
    return 'Image analysis requires OpenAI API. The image was uploaded successfully!';
  }
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: prompt || 'Analyze this astronomy image. Describe what you see, identify any celestial objects, and provide interesting facts about them.',
          },
        ],
      },
    ],
    max_tokens: 512,
  });

  return response.choices[0].message.content;
};

const getLanguageName = (code) => {
  const map = { hi: 'Hindi', te: 'Telugu', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese' };
  return map[code] || 'English';
};

module.exports = { chat, analyzeImage };
