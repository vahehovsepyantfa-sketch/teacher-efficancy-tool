const mongoose = require('mongoose');

const competencyEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const competencyEvaluationSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Free-text evaluation period label, e.g. "2026 Term 1".
    period: { type: String, required: true, trim: true },
    competencies: {
      type: [competencyEntrySchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one competency score is required',
      },
    },
    averageScore: { type: Number, default: null },
  },
  { timestamps: true }
);

competencyEvaluationSchema.index({ teacher: 1, createdAt: 1 });

module.exports = mongoose.model('CompetencyEvaluation', competencyEvaluationSchema);
