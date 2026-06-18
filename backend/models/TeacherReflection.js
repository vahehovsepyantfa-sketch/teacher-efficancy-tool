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
    // 1-5 self-rating of how the day/lesson went.
    moodRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
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
