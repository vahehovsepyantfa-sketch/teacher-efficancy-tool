const mongoose = require('mongoose');

const dailyNoteSchema = new mongoose.Schema(
  {
    // Who wrote the note (an LDM jotting an observation, or the system
    // when source is "ai").
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The teacher the note is about. Optional so LDMs can also keep
    // general notes not tied to a specific teacher.
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    date: { type: Date, default: Date.now },
    note: { type: String, required: true, trim: true },
    // "manual" = typed/voice note by a human, "ai" = generated summary
    // (used to back the AI Diary feature).
    source: {
      type: String,
      enum: ['manual', 'voice', 'ai'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

dailyNoteSchema.index({ teacher: 1, date: -1 });
dailyNoteSchema.index({ author: 1, date: -1 });

module.exports = mongoose.model('DailyNote', dailyNoteSchema);
