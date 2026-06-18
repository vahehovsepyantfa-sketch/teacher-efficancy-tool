const LessonObservation = require('../models/LessonObservation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const DailyNote = require('../models/DailyNote');
const User = require('../models/User');
const { computeEntriesAverage, buildCompetencyMatrix } = require('../utils/mathCalculations');
const { generateObservationPdf, generateEvaluationPdf } = require('../services/pdfGeneratorService');

/**
 * GET /api/ldm/teachers
 * Teachers assigned to the logged-in LDM. Admins may pass no LDM scoping
 * and instead see everyone (handled in adminController) — this endpoint
 * is for the LDM's own roster.
 */
const listMyTeachers = async (req, res) => {
  const teachers = await User.find({ assignedLdm: req.user._id, role: 'teacher' }).select(
    'name email school region createdAt'
  );
  res.json({ teachers });
};

/**
 * POST /api/ldm/observations
 */
const createObservation = async (req, res) => {
  try {
    const { teacher, date, subject, grade, strengths, areasForGrowth, competencyScores, recommendations } =
      req.body;

    if (!teacher || !Array.isArray(competencyScores) || competencyScores.length === 0) {
      return res
        .status(400)
        .json({ message: 'teacher and at least one competencyScores entry are required' });
    }

    const overallScore = computeEntriesAverage(competencyScores);

    const observation = await LessonObservation.create({
      ldm: req.user._id,
      teacher,
      date: date || Date.now(),
      subject,
      grade,
      strengths,
      areasForGrowth,
      competencyScores,
      overallScore,
      recommendations,
    });

    res.status(201).json({ observation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create observation', error: err.message });
  }
};

/**
 * GET /api/ldm/observations?teacher=<id>
 */
const listObservations = async (req, res) => {
  const filter = { ldm: req.user._id };
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const observations = await LessonObservation.find(filter)
    .populate('teacher', 'name email')
    .sort({ date: -1 });

  res.json({ observations });
};

/**
 * GET /api/ldm/observations/:id/pdf
 */
const getObservationPdf = async (req, res) => {
  const observation = await LessonObservation.findById(req.params.id)
    .populate('teacher', 'name email')
    .populate('ldm', 'name email');

  if (!observation) {
    return res.status(404).json({ message: 'Observation not found' });
  }

  const pdfBuffer = await generateObservationPdf(observation);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="observation-${observation._id}.pdf"`,
  });
  res.send(pdfBuffer);
};

/**
 * POST /api/ldm/evaluations
 */
const createEvaluation = async (req, res) => {
  try {
    const { teacher, period, competencies } = req.body;

    if (!teacher || !period || !Array.isArray(competencies) || competencies.length === 0) {
      return res
        .status(400)
        .json({ message: 'teacher, period and at least one competency score are required' });
    }

    const averageScore = computeEntriesAverage(competencies);

    const evaluation = await CompetencyEvaluation.create({
      teacher,
      evaluator: req.user._id,
      period,
      competencies,
      averageScore,
    });

    res.status(201).json({ evaluation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create evaluation', error: err.message });
  }
};

/**
 * GET /api/ldm/evaluations?teacher=<id>
 */
const listEvaluations = async (req, res) => {
  const filter = { evaluator: req.user._id };
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const evaluations = await CompetencyEvaluation.find(filter)
    .populate('teacher', 'name email')
    .sort({ createdAt: 1 });

  res.json({ evaluations });
};

/**
 * GET /api/ldm/evaluations/matrix?teacher=<id>
 * Aggregated competency averages + trend for the CompetencyMatrix view.
 */
const getCompetencyMatrix = async (req, res) => {
  if (!req.query.teacher) {
    return res.status(400).json({ message: 'teacher query param is required' });
  }

  const evaluations = await CompetencyEvaluation.find({ teacher: req.query.teacher }).sort({
    createdAt: 1,
  });

  res.json({ matrix: buildCompetencyMatrix(evaluations) });
};

/**
 * GET /api/ldm/evaluations/:id/pdf
 */
const getEvaluationPdf = async (req, res) => {
  const evaluation = await CompetencyEvaluation.findById(req.params.id)
    .populate('teacher', 'name email')
    .populate('evaluator', 'name email');

  if (!evaluation) {
    return res.status(404).json({ message: 'Evaluation not found' });
  }

  const pdfBuffer = await generateEvaluationPdf(evaluation);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="evaluation-${evaluation._id}.pdf"`,
  });
  res.send(pdfBuffer);
};

/**
 * POST /api/ldm/notes
 * Quick manual/voice note about a teacher, feeds the AI Diary.
 */
const createNote = async (req, res) => {
  try {
    const { teacher, note, date, source } = req.body;

    if (!note) {
      return res.status(400).json({ message: 'note is required' });
    }

    const created = await DailyNote.create({
      author: req.user._id,
      teacher: teacher || null,
      note,
      date: date || Date.now(),
      source: source === 'voice' ? 'voice' : 'manual',
    });

    res.status(201).json({ note: created });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
};

/**
 * GET /api/ldm/notes?teacher=<id>
 */
const listNotes = async (req, res) => {
  const filter = { author: req.user._id };
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const notes = await DailyNote.find(filter).sort({ date: -1 });
  res.json({ notes });
};

module.exports = {
  listMyTeachers,
  createObservation,
  listObservations,
  getObservationPdf,
  createEvaluation,
  listEvaluations,
  getCompetencyMatrix,
  getEvaluationPdf,
  createNote,
  listNotes,
};
