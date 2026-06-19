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

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

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

/**
 * Given a set of competency rows that already have notes/comments but no
 * (or an outdated) score, asks Gemini to suggest a 0-5 score for each one
 * based purely on its notes text. Powers the Competency Matrix's
 * "գնահատել ըստ մեկնաբանությունների" (evaluate per the comments) button —
 * the LDM can freely edit any suggested score afterward.
 *
 * @param {{name: string, notes: string}[]} rows
 * @returns {Promise<{name: string, score: number|null, rationale: string}[]>}
 */
const suggestCompetencyScores = async (rows) => {
  const withNotes = (rows || []).filter((r) => r.notes && r.notes.trim());

  if (withNotes.length === 0) {
    return [];
  }

  const ai = getClient();

  if (!ai) {
    return withNotes.map((r) => ({
      name: r.name,
      score: null,
      rationale: '[AI գնահատումը հասանելի չէ. GEMINI_API_KEY կարգավորված չէ]',
    }));
  }

  const rowsText = withNotes
    .map((r, i) => `${i + 1}. Կարողունակություն՝ "${r.name}"\n   Մեկնաբանություն/նշումներ՝ """${r.notes}"""`)
    .join('\n');

  const prompt = `Դու օգնում ես ուսուցչական աջակցության մասնագետին (ԱԶՂ) գնահատել ուսուցիչների
առաջնորդական կարողունակությունները 0-5 սանդղակով, հենվելով բացառապես իր մուտքագրած
մեկնաբանությունների/նշումների վրա։

Սանդղակը՝
0 = Լիովին բացակայում է, 1 = Ապահովված չէ, 2 = Խիստ թերի է ապահովված, 3 = Մասամբ է ապահովված,
4 = Գրեթե ապահովված է, 5 = Լիովին ապահովված է։

Կարողունակություններ և դրանց մեկնաբանությունները՝
${rowsText}

Յուրաքանչյուր կարողունակության համար գնահատիր 0-5 միավոր՝ բացառապես մեկնաբանության բովանդակության հիման վրա։
Պատասխանիր ՄԻԱՅՆ վավեր JSON զանգվածով, առանց որևէ այլ տեքստի կամ markdown blokի, հետևյալ կառուցվածքով՝
[{"name": "<կարողունակության ճշգրիտ անվանում>", "score": <0-5 ամբողջ թիվ>, "rationale": "<մեկ նախադասությամբ հիմնավորում հայերենով>"}, ...]`;

  const responseText = await generateText(prompt);

  let parsed = null;
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    parsed = null;
  }

  if (!Array.isArray(parsed)) {
    return withNotes.map((r) => ({
      name: r.name,
      score: null,
      rationale: 'AI պատասխանը չհաջողվեց մեկնաբանել',
    }));
  }

  return withNotes.map((r) => {
    const match = parsed.find((p) => p && p.name === r.name);
    const score =
      match && typeof match.score === 'number' && match.score >= 0 && match.score <= 5
        ? Math.round(match.score)
        : null;
    return { name: r.name, score, rationale: match?.rationale || '' };
  });
};

module.exports = {
  generateReflectionFeedback,
  classifyManifestation,
  suggestCompetencyScores,
};
