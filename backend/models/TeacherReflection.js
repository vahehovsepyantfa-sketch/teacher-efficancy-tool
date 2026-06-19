const mongoose = require('mongoose');
const { teachingRubricSchema, goalStepSchema } = require('./schemas/sharedSchemas');

const teacherReflectionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, default: Date.now },

    // --- Header / lesson identification (spec Module 1 field table) ---
    academicYear: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    topic: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    studentsCount: { type: Number, default: null },
    lessonPlanLink: { type: String, trim: true, default: '' },
    recordingLink: { type: String, trim: true, default: '' },

    // --- Pre-discussion reflection prompts (Rich Text + Voice-to-Text) ---
    successfulDirections: { type: String, trim: true, default: '' },
    previousGoalsProgress: { type: String, trim: true, default: '' },

    // --- "ՈՒԱ լրացման դաշտեր": teacher's self-rating using the shared
    // teaching-expectations rubric (same rubric the LDM independently
    // fills in Module 2 section Գ for the same lesson). ---
    selfRubric: { type: teachingRubricSchema, default: () => ({}) },

    // --- Goals/steps the teacher proposes going into the coaching
    // conversation (finalized jointly in the LessonObservation's
    // coaching section). ---
    goals: { type: [goalStepSchema], default: () => [{}, {}, {}] },

    // Free-text field kept for backwards compatibility / quick capture;
    // mirrors the legacy "content" field.
    content: { type: String, trim: true, default: '' },

    inputMethod: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },

    // AI-generated coaching feedback for this reflection (see aiController).
    aiFeedback: { type: String, default: '' },
  },
  { timestamps: true }
);

teacherReflectionSchema.index({ teacher: 1, date: -1 });

module.exports = mongoose.model('TeacherReflection', teacherReflectionSchema);
