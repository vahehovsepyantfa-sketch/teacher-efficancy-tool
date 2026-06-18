const LessonObservation = require('../models/LessonObservation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const DailyNote = require('../models/DailyNote');
const TeacherReflection = require('../models/TeacherReflection');
const User = require('../models/User');
const { computeEntriesAverage } = require('../utils/mathCalculations');
const { buildCategorizedMatrix, ALL_COMPETENCIES } = require('../utils/competencyFramework');
const { generateObservationPdf, generateEvaluationPdf } = require('../services/pdfGeneratorService');

/**
 * GET /api/ldm/teachers
 * Teachers assigned to the logged-in LDM. Admins may pass no LDM scoping
 * and instead see everyone (handled in adminController) — this endpoint
 * is for the LDM's own roster.
 */
const listMyTeachers = async (req, res) => {
  const filter = req.user.role === 'admin' ? { role: 'teacher' } : { assignedLdm: req.user._id, role: 'teacher' };
  const teachers = await User.find(filter).select('name email school region createdAt');
  res.json({ teachers });
};

/**
 * Confirms the given teacher is in this LDM's roster (row-level security
 * per spec: each LDM only ever sees the 10-12 teachers Admin assigned to
 * them). Admins bypass this check.
 */
const assertCanAccessTeacher = async (req, teacherId) => {
  if (req.user.role === 'admin') return true;
  const teacher = await User.findOne({ _id: teacherId, assignedLdm: req.user._id, role: 'teacher' });
  return !!teacher;
};

/**
 * GET /api/ldm/teachers/:id/reflections
 * A specific assigned teacher's self-reflections, so the specialist can
 * review the teacher's self-analysis before scoring the lesson plan.
 */
const getTeacherReflections = async (req, res) => {
  const allowed = await assertCanAccessTeacher(req, req.params.id);
  if (!allowed) {
    return res.status(403).json({ message: 'This teacher is not assigned to you' });
  }
  const reflections = await TeacherReflection.find({ teacher: req.params.id }).sort({ date: -1 });
  res.json({ reflections });
};

/**
 * POST /api/ldm/observations
 */
const createObservation = async (req, res) => {
  try {
    const {
      teacher,
      date,
      subject,
      grade,
      lessonPlanLink,
      recordingLink,
      strengths,
      areasForGrowth,
      competencyScores,
      recommendations,
    } = req.body;

    if (!teacher || !Array.isArray(competencyScores) || competencyScores.length === 0) {
      return res
        .status(400)
        .json({ message: 'teacher and at least one competencyScores entry are required' });
    }

    const allowed = await assertCanAccessTeacher(req, teacher);
    if (!allowed) {
      return res.status(403).json({ message: 'This teacher is not assigned to you' });
    }

    const overallScore = computeEntriesAverage(competencyScores);

    const observation = await LessonObservation.create({
      ldm: req.user._id,
      teacher,
      date: date || Date.now(),
      subject,
      grade,
      lessonPlanLink,
      recordingLink,
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
  const filter = req.user.role === 'admin' ? {} : { ldm: req.user._id };
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
 * `competencies` should ideally cover all 18 framework competencies (see
 * utils/competencyFramework.ALL_COMPETENCIES) so categoryAverages and the
 * overall average are meaningful, but partial submissions are accepted.
 */
const createEvaluation = async (req, res) => {
  try {
    const { teacher, period, competencies, source } = req.body;

    if (!teacher || !period || !Array.isArray(competencies) || competencies.length === 0) {
      return res
        .status(400)
        .json({ message: 'teacher, period and at least one competency score are required' });
    }

    const allowed = await assertCanAccessTeacher(req, teacher);
    if (!allowed) {
      return res.status(403).json({ message: 'This teacher is not assigned to you' });
    }

    const { categories, overallAverage } = buildCategorizedMatrix(competencies);
    const categoryAverages = categories.map((c) => ({ key: c.key, name: c.name, average: c.categoryAverage }));

    const evaluation = await CompetencyEvaluation.create({
      teacher,
      evaluator: req.user._id,
      period,
      competencies,
      categoryAverages,
      averageScore: overallAverage,
      source: source === 'ai-chat' ? 'ai-chat' : 'manual',
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
  const filter = req.user.role === 'admin' ? {} : { evaluator: req.user._id };
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const evaluations = await CompetencyEvaluation.find(filter)
    .populate('teacher', 'name email')
    .sort({ createdAt: 1 });

  res.json({ evaluations });
};

/**
 * GET /api/ldm/evaluations/matrix?teacher=<id>
 * The most recent evaluation's full 18-competency / 5-category breakdown,
 * for the live CompetencyMatrix view, plus the blank framework so the UI
 * can render all 18 rows even with zero evaluations yet.
 */
const getCompetencyMatrix = async (req, res) => {
  if (!req.query.teacher) {
    return res.status(400).json({ message: 'teacher query param is required' });
  }

  const latest = await CompetencyEvaluation.findOne({ teacher: req.query.teacher }).sort({
    createdAt: -1,
  });

  const matrix = buildCategorizedMatrix(latest ? latest.competencies : []);
  res.json({ matrix, latestEvaluationId: latest?._id || null, period: latest?.period || null });
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
 * Quick manual/voice note about a teacher — also used as one "message" in
 * the manifestation-sorting chat (see aiController.classifyManifestation).
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
  const filter = req.user.role === 'admin' ? {} : { author: req.user._id };
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const notes = await DailyNote.find(filter).sort({ date: -1 });
  res.json({ notes });
};

module.exports = {
  listMyTeachers,
  getTeacherReflections,
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
