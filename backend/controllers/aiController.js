const TeacherReflection = require('../models/TeacherReflection');
const Manifestation = require('../models/Manifestation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const User = require('../models/User');
const {
  generateReflectionFeedback,
  classifyManifestation: classifyManifestationAi,
  suggestCompetencyScores: suggestCompetencyScoresAi,
} = require('../services/geminiAiService');
const { buildCategorizedMatrix, ALL_COMPETENCIES } = require('../utils/competencyFramework');

/**
 * POST /api/ai/reflections/:id/feedback
 * Generates (and persists) AI coaching feedback for one reflection.
 * Available to the teacher who owns it, or their LDM/an admin.
 */
const generateFeedbackForReflection = async (req, res) => {
  try {
    const reflection = await TeacherReflection.findById(req.params.id);
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }

    const isOwner = reflection.teacher.toString() === req.user._id.toString();
    if (!isOwner && !['ldm', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view this reflection' });
    }

    const feedback = await generateReflectionFeedback(reflection.content);
    reflection.aiFeedback = feedback;
    await reflection.save();

    res.json({ reflection });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate feedback', error: err.message });
  }
};

const assertCanAccessTeacher = async (req, teacherId) => {
  if (req.user.role === 'admin') return true;
  const teacher = await User.findOne({ _id: teacherId, assignedLdm: req.user._id, role: 'teacher' });
  return !!teacher;
};

/**
 * Finds the teacher's most recent CompetencyEvaluation (any source), or
 * creates a fresh one pre-seeded with all 18 framework rows (unscored) if
 * none exists yet. Returns a live Mongoose document so callers can mutate
 * and `.save()` it.
 */
const findOrCreateCurrentEvaluation = async (teacherId, evaluatorId) => {
  let evaluation = await CompetencyEvaluation.findOne({ teacher: teacherId }).sort({ createdAt: -1 });

  if (!evaluation) {
    evaluation = await CompetencyEvaluation.create({
      teacher: teacherId,
      evaluator: evaluatorId,
      period: 'Ընթացիկ',
      competencies: ALL_COMPETENCIES.map((name) => ({ name, score: null, notes: '' })),
      categoryAverages: [],
      averageScore: null,
      source: 'ai-chat',
    });
  }

  return evaluation;
};

/**
 * Appends `text` into the matching competency's `notes` field on the
 * teacher's current evaluation, and recomputes its category/overall
 * averages. This is how the manifestation chat lands inside the
 * Competency Matrix.
 */
const appendNoteToEvaluation = async (teacherId, evaluatorId, competencyName, text) => {
  if (!competencyName) return null;

  const evaluation = await findOrCreateCurrentEvaluation(teacherId, evaluatorId);

  let entry = evaluation.competencies.find((c) => c.name === competencyName);
  if (!entry) {
    evaluation.competencies.push({ name: competencyName, score: null, notes: '' });
    entry = evaluation.competencies[evaluation.competencies.length - 1];
  }
  entry.notes = entry.notes ? `${entry.notes}\n${text}` : text;

  const { categories, overallAverage } = buildCategorizedMatrix(evaluation.competencies);
  evaluation.categoryAverages = categories.map((c) => ({ key: c.key, name: c.name, average: c.categoryAverage }));
  evaluation.averageScore = overallAverage;

  await evaluation.save();
  return evaluation;
};

/**
 * POST /api/ai/manifestations
 * Body: { teacher, period, text }
 * The chat-style sorter: one typed "manifestation" (observed behavior) is
 * classified by Gemini into one of the 18 fixed leadership competencies,
 * saved to the chat log, AND landed inside that competency's notes field
 * on the teacher's current Competency Matrix evaluation.
 */
const classifyManifestation = async (req, res) => {
  try {
    const { teacher, period, text } = req.body;

    if (!teacher || !text) {
      return res.status(400).json({ message: 'teacher and text are required' });
    }

    const allowed = await assertCanAccessTeacher(req, teacher);
    if (!allowed) {
      return res.status(403).json({ message: 'This teacher is not assigned to you' });
    }

    const result = await classifyManifestationAi(text);

    const manifestation = await Manifestation.create({
      author: req.user._id,
      teacher,
      period: period || '',
      text,
      competency: result.competency,
      categoryKey: result.category?.key || null,
      categoryName: result.category?.name || null,
      confidence: result.confidence,
      aiNote: result.note,
    });

    let evaluation = null;
    if (result.competency) {
      evaluation = await appendNoteToEvaluation(teacher, req.user._id, result.competency, text);
    }

    res.status(201).json({ manifestation, evaluationId: evaluation?._id || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to classify manifestation', error: err.message });
  }
};

/**
 * GET /api/ai/manifestations?teacher=<id>&period=<string>
 * All classified manifestations for a teacher (optionally one period),
 * both as a flat chat history and grouped into the 5-category / 18-row
 * framework so the UI can render them "sitting" in their competencies.
 */
const listManifestations = async (req, res) => {
  if (!req.query.teacher) {
    return res.status(400).json({ message: 'teacher query param is required' });
  }

  const allowed = await assertCanAccessTeacher(req, req.query.teacher);
  if (!allowed) {
    return res.status(403).json({ message: 'This teacher is not assigned to you' });
  }

  const filter = { teacher: req.query.teacher };
  if (req.query.period) filter.period = req.query.period;

  const manifestations = await Manifestation.find(filter).sort({ createdAt: 1 });

  const grouped = buildCategorizedMatrix([]);
  grouped.categories.forEach((cat) => {
    cat.rows.forEach((row) => {
      row.manifestations = manifestations
        .filter((m) => m.competency === row.name)
        .map((m) => ({ id: m._id, text: m.text, confidence: m.confidence, createdAt: m.createdAt }));
    });
  });
  const uncategorized = manifestations.filter((m) => !m.competency);

  res.json({ manifestations, grouped, uncategorized });
};

/**
 * POST /api/ai/competencies/suggest-scores
 * Body: { teacher, competencies: [{name, notes}] }
 * Powers the Competency Matrix's "գնահատել ըստ մեկնաբանությունների" button:
 * AI suggests a 0-5 score for every row that has notes, based purely on
 * that note text. Scores are returned only — the LDM applies/edits them
 * client-side and still presses the normal save button to persist.
 */
const suggestScores = async (req, res) => {
  try {
    const { teacher, competencies } = req.body;

    if (!teacher || !Array.isArray(competencies)) {
      return res.status(400).json({ message: 'teacher and competencies are required' });
    }

    const allowed = await assertCanAccessTeacher(req, teacher);
    if (!allowed) {
      return res.status(403).json({ message: 'This teacher is not assigned to you' });
    }

    const suggestions = await suggestCompetencyScoresAi(competencies);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to suggest scores', error: err.message });
  }
};

module.exports = {
  generateFeedbackForReflection,
  classifyManifestation,
  listManifestations,
  suggestScores,
};
