const mongoose = require('mongoose');

const teacherReflectionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    content: {
      type: String,
      required: [true, 'Reflection content is required'],
      trim: true,
    },
    // How the reflection was captured: typed directly, or via the
    // VoiceToTextButton component on the frontend.
    inputMethod: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    // Official spec scale: 0-5 self-rating of how the day/lesson went.
    moodRating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    // Required links per spec Module 1 ("Դասի պլանի հղում" / "Դասի ձայնագրության հղում").
    lessonPlanLink: { type: String, trim: true, default: '' },
    recordingLink: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    studentsCount: { type: Number, default: null },
    // "What worked well" / "progress on previous goals" — spec's named
    // reflection prompts, each fillable via voice-to-text.
    successfulDirections: { type: String, trim: true, default: '' },
    previousGoalsProgress: { type: String, trim: true, default: '' },
    // AI-generated coaching feedback for this reflection (see aiController).
    aiFeedback: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

teacherReflectionSchema.index({ teacher: 1, date: -1 });

module.exports = mongoose.model('TeacherReflection', teacherReflectionSchema);
