const { GoogleGenAI } = require('@google/genai');
const { ALL_COMPETENCIES, COMPETENCY_CATEGORIES } = require('../utils/competencyFramework');

let client = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const generateText = async (prompt) => {
  const ai = getClient();

  if (!ai) {
    // No API key configured — fail soft so the rest of the app keeps
    // working without AI features instead of crashing the request.
    return '[AI feedback unavailable: GEMINI_API_KEY is not configured]';
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text || '';
};

/**
 * Short, encouraging coaching feedback on a single teacher reflection.
 */
const generateReflectionFeedback = async (reflectionText) => {
  const prompt = `You are a supportive instructional coach for a teacher training program in Armenia.
A teacher wrote this daily reflection:
"""
${reflectionText}
"""
In 3-4 sentences, give warm, specific, actionable coaching feedback. Acknowledge
something concrete from the reflection, then suggest one practical next step.`;

  return generateText(prompt);
};

/**
 * Synthesizes a narrative "diary" summarizing a teacher's recent reflections,
 * lesson observations, and notes into a short progress story for their LDM.
 */
const generateDiarySummary = async ({ teacherName, entries }) => {
  const formatted = entries
    .map((e) => `- [${e.type} | ${new Date(e.date).toISOString().slice(0, 10)}] ${e.text}`)
    .join('\n');

  const prompt = `You are helping an LDM (Learning & Development Manager) at Teach For Armenia
review a teacher's recent development. Here are dated entries for ${teacherName},
combining their self-reflections, lesson observation notes, and coach notes:

${formatted || '(no entries in this period)'}

Write a short (5-8 sentence) "diary" style narrative summarizing ${teacherName}'s
recent growth: recurring themes, visible progress, and 1-2 areas to focus on next.
Write in second person plural ("the teacher has been...") and keep an encouraging,
professional tone suitable for a coaching conversation.`;

  return generateText(prompt);
};

const COMPETENCY_LIST_TEXT = COMPETENCY_CATEGORIES
  .map((cat) => `${cat.name}:\n${cat.competencies.map((c) => `  - ${c}`).join('\n')}`)
  .join('\n');

/**
 * Classifies one free-text "manifestation" (a short observed behavior,
 * written in Armenian by an LDM/coach) into exactly one of the 18 fixed
 * leadership competencies, returning structured JSON. This powers the
 * chat-style sorter: the coach types what they observed, one line at a
 * time, and it lands directly in the right competency's notes/comments.
 */
const classifyManifestation = async (text) => {
  const ai = getClient();

  if (!ai) {
    return {
      competency: null,
      category: null,
      confidence: 0,
      note: '[AI դասակարգումը հասանելի չէ. GEMINI_API_KEY կարգավորված չէ]',
      raw: text,
    };
  }

  const prompt = `Դու օգնում ես ուսուցչական աջակցության մասնագետին (ԱԶՂ) դասակարգել
ուսուցիչների մոտ նկատված առաջնորդական դրսևորումները 18 հաստատագրված կարողունակություններից մեկում։

Կարողունակությունների ամբողջական ցանկը (խմբերով)՝
${COMPETENCY_LIST_TEXT}

Մասնագետի մուտքագրած դրսևորումը՝
"""
${text}
"""

Պատասխանիր ՄԻԱՅՆ վավեր JSON օբյեկտով, առանց որևէ այլ տեքստի կամ markdown blokի, հետևյալ կառուցվածքով՝
{"competency": "<վերևի ցանկից ճշգրիտ մեկ կարողունակության անվանում>", "confidence": <0-ից 1 թիվ>, "reason": "<մեկ նախադասությամբ հիմնավորում հայերենով>"}

Եթե դրսևորումը հստակորեն չի համապատասխանում որևէ կարողունակության, ընտրիր ամենամոտը։`;

  const responseText = await generateText(prompt);

  let parsed = null;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    parsed = null;
  }

  let competency = parsed?.competency && ALL_COMPETENCIES.includes(parsed.competency)
    ? parsed.competency
    : null;

  // Fallback: look for any competency name verbatim inside the raw reply.
  if (!competency) {
    competency = ALL_COMPETENCIES.find((name) => responseText.includes(name)) || null;
  }

  const category = competency
    ? COMPETENCY_CATEGORIES.find((cat) => cat.competencies.includes(competency))
    : null;

  return {
    competency,
    category: category ? { key: category.key, name: category.name } : null,
    confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : null,
    note: parsed?.reason || responseText,
    raw: text,
  };
};

module.exports = {
  generateReflectionFeedback,
  generateDiarySummary,
  classifyManifestation,
};
