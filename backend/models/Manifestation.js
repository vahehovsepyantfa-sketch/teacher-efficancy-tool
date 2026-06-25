const mongoose = require('mongoose');

/**
 * One line of the AI manifestation-sorting chat: the LDM/coach types a
 * short observed behavior, Gemini classifies it into one of the 18 fixed
 * leadership competencies, and it is stored here so the chat can show it
 * "sitting" inside its competency bucket (spec: ԱԶՂ chat that auto-sorts
 * դրսևորումները into կարողունակություններ).
 */
const manifestationSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, trim: true, default: '', maxlength: 100 },
    text: { type: String, required: true, trim: true, maxlength: 3000 },
    competency: { type: String, default: null },
    categoryKey: { type: String, default: null },
    categoryName: { type: String, default: null },
    confidence: { type: Number, default: null },
    aiNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

manifestationSchema.index({ teacher: 1, period: 1, createdAt: 1 });

module.exports = mongoose.model('Manifestation', manifestationSchema);
