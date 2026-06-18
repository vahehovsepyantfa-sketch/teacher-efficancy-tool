const mongoose = require('mongoose');

const competencyScoreSchema = new mongoose.Schema(
  {
    competency: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 5 },
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
