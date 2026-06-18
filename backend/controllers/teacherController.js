const TeacherReflection = require('../models/TeacherReflection');
const LessonObservation = require('../models/LessonObservation');
const CompetencyEvaluation = require('../models/CompetencyEvaluation');
const User = require('../models/User');

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
      content,
      moodRating,
      inputMethod,
      date,
      lessonPlanLink,
      recordingLink,
      subject,
      grade,
      studentsCount,
      successfulDirections,
      previousGoalsProgress,
    } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    const reflection = await TeacherReflection.create({
      teacher: req.user._id,
      content,
      moodRating,
      inputMethod: inputMethod === 'voice' ? 'voice' : 'text',
      date: date || Date.now(),
      lessonPlanLink,
      recordingLink,
      subject,
      grade,
      studentsCount,
      successfulDirections,
      previousGoalsProgress,
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
  const observations = await LessonObservation.find({ teacher: req.user._id })
    .populate('ldm', 'name email')
    .sort({ date: -1 });
  res.json({ observations });
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
  listMyEvaluations,
};
