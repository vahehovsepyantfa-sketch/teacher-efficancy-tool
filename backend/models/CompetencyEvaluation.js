const mongoose = require('mongoose');

const competencyEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // Official spec scale: 0-5 (0 = Լիովին բացակայում է … 5 = Լիովին ապահովված է).
    // Optional/null: a competency can carry notes (e.g. pushed in from the
    // manifestation chat) before it has ever been scored.
    score: { type: Number, default: null, min: 0, max: 5 },
    notes: { type: String, default: '', trim: true, maxlength: 3000 },
  },
  { _id: false }
);

const categoryAverageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true, maxlength: 200 },
    average: { type: Number, default: null },
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
    period: { type: String, required: true, trim: true, maxlength: 100 },
    competencies: {
      type: [competencyEntrySchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one competency score is required',
      },
    },
    // Per-category averages, snapshotted at save time (5 categories).
    categoryAverages: { type: [categoryAverageSchema], default: [] },
    // Overall average = sum of all 18 competency scores / 18 (spec section 4-B).
    averageScore: { type: Number, default: null },
    // Where this evaluation's scores came from: typed manually into the
    // matrix, or produced via the AI manifestation-sorting chat.
    source: { type: String, enum: ['manual', 'ai-chat'], default: 'manual' },
  },
  { timestamps: true }
);

competencyEvaluationSchema.index({ teacher: 1, createdAt: 1 });

module.exports = mongoose.model('CompetencyEvaluation', competencyEvaluationSchema);
