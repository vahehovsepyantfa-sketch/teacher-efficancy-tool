const TeacherReflection = require('../models/TeacherReflection');
const LessonObservation = require('../models/LessonObservation');
const DailyNote = require('../models/DailyNote');
const User = require('../models/User');
const { generateReflectionFeedback, generateDiarySummary } = require('../services/geminiAiService');

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

/**
 * POST /api/ai/diary
 * Body: { teacher: <id>, days: <number = 14> }
 * Synthesizes recent reflections, observations, and notes for a teacher
 * into a narrative summary, then saves it as an "ai"-sourced DailyNote so
 * it shows up in that teacher's diary history.
 */
const generateTeacherDiary = async (req, res) => {
  try {
    const { teacher: teacherId, days = 14 } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: 'teacher is required' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const [reflections, observations, notes] = await Promise.all([
      TeacherReflection.find({ teacher: teacherId, date: { $gte: since } }).sort({ date: 1 }),
      LessonObservation.find({ teacher: teacherId, date: { $gte: since } }).sort({ date: 1 }),
      DailyNote.find({ teacher: teacherId, date: { $gte: since }, source: { $ne: 'ai' } }).sort({
        date: 1,
      }),
    ]);

    const entries = [
      ...reflections.map((r) => ({ type: 'reflection', date: r.date, text: r.content })),
      ...observations.map((o) => ({
        type: 'observation',
        date: o.date,
        text: `Strengths: ${o.strengths || '—'}. Areas for growth: ${o.areasForGrowth || '—'}.`,
      })),
      ...notes.map((n) => ({ type: 'note', date: n.date, text: n.note })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const summary = await generateDiarySummary({ teacherName: teacher.name, entries });

    const diaryEntry = await DailyNote.create({
      author: req.user._id,
      teacher: teacherId,
      note: summary,
      source: 'ai',
    });

    res.status(201).json({ diaryEntry, entriesConsidered: entries.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate diary', error: err.message });
  }
};

/**
 * GET /api/ai/diary?teacher=<id>
 * History of AI-generated diary entries for a teacher.
 */
const listTeacherDiary = async (req, res) => {
  if (!req.query.teacher) {
    return res.status(400).json({ message: 'teacher query param is required' });
  }

  const entries = await DailyNote.find({ teacher: req.query.teacher, source: 'ai' }).sort({
    date: -1,
  });

  res.json({ entries });
};

module.exports = {
  generateFeedbackForReflection,
  generateTeacherDiary,
  listTeacherDiary,
};
