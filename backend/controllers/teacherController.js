const TeacherReflection = require('../models/TeacherReflection');
const LessonObservation = require('../models/LessonObservation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const User = require('../models/User');
const { computeTeachingRubric, normalizeGoals } = require('../utils/observationRubrics');
const { generateObservationPdf } = require('../services/pdfGeneratorService');

/**
 * GET /api/teacher/me
 * Returns the logged-in teacher's profile, including their assigned LDM.
 */
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedLdm', 'name email');
  res.json({ user });
};

/**
 * POST /api/teacher/reflections
 */
const createReflection = async (req, res) => {
  try {
    const {
      academicYear,
      subject,
      topic,
      grade,
      studentsCount,
      lessonPlanLink,
      recordingLink,
      successfulDirections,
      previousGoalsProgress,
      selfRubric,
      goals,
      content,
      inputMethod,
      date,
    } = req.body;

    // Per spec page 2: both link fields are marked "Պարտադիր" (required).
    if (!lessonPlanLink || !recordingLink) {
      return res
        .status(400)
        .json({ message: 'lessonPlanLink and recordingLink are required' });
    }

    const reflection = await TeacherReflection.create({
      teacher: req.user._id,
      date: date || Date.now(),
      academicYear,
      subject,
      topic,
      grade,
      studentsCount,
      lessonPlanLink,
      recordingLink,
      successfulDirections,
      previousGoalsProgress,
      selfRubric: computeTeachingRubric(selfRubric),
      goals: normalizeGoals(goals),
      content: content || '',
      inputMethod: inputMethod === 'voice' ? 'voice' : 'text',
    });

    res.status(201).json({ reflection });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reflection', error: err.message });
  }
};

/**
 * GET /api/teacher/reflections
 * The logged-in teacher's own reflections, newest first.
 */
const listMyReflections = async (req, res) => {
  const reflections = await TeacherReflection.find({ teacher: req.user._id }).sort({ date: -1 });
  res.json({ reflections });
};

/**
 * GET /api/teacher/observations
 * Lesson observations written about the logged-in teacher.
 */
const listMyObservations = async (req, res) => {
  // Per spec page 5: the teacher only sees an observation once the LDM has
  // pressed "Ուղարկել" (Send) on it.
  const observations = await LessonObservation.find({ teacher: req.user._id, sent: true })
    .populate('ldm', 'name email')
    .sort({ date: -1 });
  res.json({ observations });
};

/**
 * GET /api/teacher/observations/:id/pdf
 * The teacher may only download an observation about themself, and only
 * once the LDM has sent it.
 */
const getObservationPdf = async (req, res) => {
  const observation = await LessonObservation.findOne({
    _id: req.params.id,
    teacher: req.user._id,
    sent: true,
  })
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
 * GET /api/teacher/evaluations
 * Competency evaluations written about the logged-in teacher.
 */
const listMyEvaluations = async (req, res) => {
  const evaluations = await CompetencyEvaluation.find({ teacher: req.user._id })
    .populate('evaluator', 'name email')
    .sort({ createdAt: -1 });
  res.json({ evaluations });
};

module.exports = {
  getProfile,
  createReflection,
  listMyReflections,
  listMyObservations,
  getObservationPdf,
  listMyEvaluations,
};
