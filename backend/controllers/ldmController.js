const LessonObservation = require('../models/LessonObservation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const TeacherReflection = require('../models/TeacherReflection');
const User = require('../models/User');
const { computeEntriesAverage } = require('../utils/mathCalculations');
const { buildCategorizedMatrix, ALL_COMPETENCIES } = require('../utils/competencyFramework');
const { generateObservationPdf, generateEvaluationPdf } = require('../services/pdfGeneratorService');
const {
  computePlanningRubric,
  computeTeachingRubric,
  computeOverallExpectationsRubric,
  computeGrandAverage,
  normalizeTimeline,
  normalizeGoals,
} = require('../utils/observationRubrics');

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
 * Saves (creates or, if `id` is given, updates) a lesson observation draft.
 * Sections Ա-Ե are each run through their respective rubric normalizer so
 * partial/out-of-order client submissions still compute clean averages.
 * Does NOT make the observation visible to the teacher — see sendObservation.
 */
const createObservation = async (req, res) => {
  try {
    const {
      id,
      teacher,
      date,
      subject,
      grade,
      lessonPlanLink,
      recordingLink,
      planningRubric,
      timeline,
      teachingRubric,
      coaching,
      overallExpectations,
    } = req.body;

    if (!teacher) {
      return res.status(400).json({ message: 'teacher is required' });
    }

    const allowed = await assertCanAccessTeacher(req, teacher);
    if (!allowed) {
      return res.status(403).json({ message: 'This teacher is not assigned to you' });
    }

    const computedPlanning = computePlanningRubric(planningRubric);
    const computedTeaching = computeTeachingRubric(teachingRubric);
    const computedOverallExpectations = computeOverallExpectationsRubric(overallExpectations);
    const grandAverage = computeGrandAverage(
      computedPlanning.overallAverage,
      computedTeaching.overallAverage,
      computedOverallExpectations.overallAverage
    );

    // Read-only convenience copy of the teacher's latest shared links, so
    // the LDM can open them from the observation form/PDF without leaving
    // the page. Falls back to whatever the client sent.
    let resolvedLessonPlanLink = lessonPlanLink || '';
    let resolvedRecordingLink = recordingLink || '';
    if (!resolvedLessonPlanLink || !resolvedRecordingLink) {
      const latestReflection = await TeacherReflection.findOne({ teacher }).sort({ date: -1 });
      if (latestReflection) {
        resolvedLessonPlanLink = resolvedLessonPlanLink || latestReflection.lessonPlanLink || '';
        resolvedRecordingLink = resolvedRecordingLink || latestReflection.recordingLink || '';
      }
    }

    const payload = {
      ldm: req.user._id,
      teacher,
      date: date || Date.now(),
      subject,
      grade,
      lessonPlanLink: resolvedLessonPlanLink,
      recordingLink: resolvedRecordingLink,
      planningRubric: computedPlanning,
      timeline: normalizeTimeline(timeline),
      teachingRubric: computedTeaching,
      coaching: {
        feltAtStart: coaching?.feltAtStart || '',
        selfReflectionSummary: coaching?.selfReflectionSummary || '',
        strengthsObserved: coaching?.strengthsObserved || '',
        improvementsObserved: coaching?.improvementsObserved || '',
        questionsForTeacher: coaching?.questionsForTeacher || '',
        practicalWorkPlan: coaching?.practicalWorkPlan || '',
        feltAtEnd: coaching?.feltAtEnd || '',
        goals: normalizeGoals(coaching?.goals),
        resourcesAndGuidance: coaching?.resourcesAndGuidance || '',
      },
      overallExpectations: computedOverallExpectations,
      grandAverage,
    };

    let observation;
    if (id) {
      observation = await LessonObservation.findOneAndUpdate(
        { _id: id, ldm: req.user.role === 'admin' ? { $exists: true } : req.user._id },
        payload,
        { new: true }
      );
      if (!observation) {
        return res.status(404).json({ message: 'Observation not found' });
      }
    } else {
      observation = await LessonObservation.create(payload);
    }

    res.status(201).json({ observation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save observation', error: err.message });
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
 * GET /api/ldm/observations/:id
 */
const getObservation = async (req, res) => {
  const observation = await LessonObservation.findById(req.params.id)
    .populate('teacher', 'name email')
    .populate('ldm', 'name email');

  if (!observation) {
    return res.status(404).json({ message: 'Observation not found' });
  }
  const allowed = await assertCanAccessTeacher(req, observation.teacher._id || observation.teacher);
  if (!allowed) {
    return res.status(403).json({ message: 'This teacher is not assigned to you' });
  }

  res.json({ observation });
};

/**
 * POST /api/ldm/observations/:id/send
 * Per spec page 5: only after the LDM presses this does the observation
 * become visible to the teacher under "Իմ դասի վերլուծություն".
 */
const sendObservation = async (req, res) => {
  const observation = await LessonObservation.findById(req.params.id);
  if (!observation) {
    return res.status(404).json({ message: 'Observation not found' });
  }
  const allowed = await assertCanAccessTeacher(req, observation.teacher);
  if (!allowed) {
    return res.status(403).json({ message: 'This teacher is not assigned to you' });
  }

  observation.sent = true;
  observation.sentAt = new Date();
  await observation.save();

  res.json({ observation });
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

module.exports = {
  listMyTeachers,
  getTeacherReflections,
  createObservation,
  listObservations,
  getObservation,
  sendObservation,
  getObservationPdf,
  createEvaluation,
  listEvaluations,
  getCompetencyMatrix,
  getEvaluationPdf,
};
