const mongoose = require('mongoose');

const competencyScoreSchema = new mongoose.Schema(
  {
    competency: { type: String, required: true, trim: true },
    // Official spec scale: 0-5.
    score: { type: Number, required: true, min: 0, max: 5 },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const lessonObservationSchema = new mongoose.Schema(
  {
    ldm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, default: Date.now },
    subject: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    // Links the teacher shared on their reflection (spec Module 1), shown
    // here read-only so the specialist can open them while scoring.
    lessonPlanLink: { type: String, trim: true, default: '' },
    recordingLink: { type: String, trim: true, default: '' },
    strengths: { type: String, trim: true, default: '' },
    areasForGrowth: { type: String, trim: true, default: '' },
    competencyScores: [competencyScoreSchema],
    // Average of competencyScores, computed via utils/mathCalculations
    // before saving so it doesn't need to be recalculated on every read.
    overallScore: { type: Number, default: null },
    recommendations: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

lessonObservationSchema.index({ teacher: 1, date: -1 });
lessonObservationSchema.index({ ldm: 1, date: -1 });

module.exports = mongoose.model('LessonObservation', lessonObservationSchema);
