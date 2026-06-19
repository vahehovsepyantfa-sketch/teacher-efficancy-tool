const mongoose = require('mongoose');

/** One scored row inside a rubric category, or a flat planning rubric. */
const rubricRowSchema = new mongoose.Schema(
  {
    key: { type: String, default: '' },
    label: { type: String, required: true, trim: true },
    score: { type: Number, min: 0, max: 5, default: null },
    comment: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/** A headline (score + comment) used at the top of a rubric. */
const rubricHeadlineSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 5, default: null },
    comment: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/** One category inside the shared "teaching expectations" rubric. */
const rubricCategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    rows: [rubricRowSchema],
    categoryComment: { type: String, default: '', trim: true },
    categoryAverage: { type: Number, default: null },
  },
  { _id: false }
);

/**
 * The shared "teaching expectations" rubric (Module 1 self-rating /
 * Module 2 section Գ): one headline statement + 3 fixed categories of
 * criteria rows, each 0-5 scored with a comment, plus computed averages.
 */
const teachingRubricSchema = new mongoose.Schema(
  {
    headline: { type: rubricHeadlineSchema, default: () => ({}) },
    categories: [rubricCategorySchema],
    overallAverage: { type: Number, default: null },
    summaryComment: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/** Module 2 section Ա: flat planning rubric (headline + 5 criteria rows). */
const planningRubricSchema = new mongoose.Schema(
  {
    headline: { type: rubricHeadlineSchema, default: () => ({}) },
    rows: [rubricRowSchema],
    overallAverage: { type: Number, default: null },
    generalComment: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/** Module 2 section Բ: one row of the real-time lesson timeline matrix. */
const timelineRowSchema = new mongoose.Schema(
  {
    phase: { type: String, required: true, trim: true },
    teacherActions: { type: String, default: '', trim: true },
    studentActions: { type: String, default: '', trim: true },
    questionsObservations: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/** Shared goal/step row, used by Module 1's goals table and Module 2-Դ's. */
const goalStepSchema = new mongoose.Schema(
  {
    goal: { type: String, default: '', trim: true },
    steps: { type: String, default: '', trim: true },
  },
  { _id: false }
);

module.exports = {
  rubricRowSchema,
  rubricHeadlineSchema,
  rubricCategorySchema,
  teachingRubricSchema,
  planningRubricSchema,
  timelineRowSchema,
  goalStepSchema,
};
