const { GoogleGenAI } = require('@google/genai');

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

module.exports = {
  generateReflectionFeedback,
  generateDiarySummary,
};
