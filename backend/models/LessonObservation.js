const mongoose = require('mongoose');
const {
  teachingRubricSchema,
  planningRubricSchema,
  timelineRowSchema,
  goalStepSchema,
} = require('./schemas/sharedSchemas');

/** Module 2 section Դ: the coaching / analytical conversation. */
const coachingSchema = new mongoose.Schema(
  {
    feltAtStart: { type: String, default: '', trim: true },
    selfReflectionSummary: { type: String, default: '', trim: true },
    strengthsObserved: { type: String, default: '', trim: true },
    improvementsObserved: { type: String, default: '', trim: true },
    questionsForTeacher: { type: String, default: '', trim: true },
    practicalWorkPlan: { type: String, default: '', trim: true },
    feltAtEnd: { type: String, default: '', trim: true },
    goals: { type: [goalStepSchema], default: () => [{}, {}, {}] },
    resourcesAndGuidance: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const lessonObservationSchema = new mongoose.Schema(
  {
    ldm: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    subject: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    // Links the teacher shared on their reflection (spec Module 1), shown
    // here read-only so the specialist can open them while scoring.
    lessonPlanLink: { type: String, trim: true, default: '' },
    recordingLink: { type: String, trim: true, default: '' },

    // Ա. Դասապլանի և դասի պլանավորման ընդհանուր ակնկալիքներ
    planningRubric: { type: planningRubricSchema, default: () => ({}) },

    // Բ. Դասալսման ընթացքում իրական ժամանակի ժրոնիկոն (5-phase matrix)
    timeline: { type: [timelineRowSchema], default: () => [] },

    // Գ. Դասավանդման Ընդհանուր Ակնկալիքների Գնահատման Բաղադրիչներ
    // (the same shared rubric the teacher self-rates in Module 1)
    teachingRubric: { type: teachingRubricSchema, default: () => ({}) },

    // Դ. Քոուչինգի և Վերլուծական Զրույցի Բաժին
    coaching: { type: coachingSchema, default: () => ({}) },

    // Ե. Ընդհանուր դիտարկումներ (closing holistic meta-rubric, filled by
    // the LDM after reviewing the self-reflection + planning rubric +
    // teaching rubric + coaching conversation together).
    overallExpectations: { type: planningRubricSchema, default: () => ({}) },

    // Grand average of planningRubric / teachingRubric / overallExpectations.
    grandAverage: { type: Number, default: null },

    // Legacy free-text fields, kept for the older simplified form/PDF.
    strengths: { type: String, trim: true, default: '' },
    areasForGrowth: { type: String, trim: true, default: '' },
    recommendations: { type: String, trim: true, default: '' },

    // Per spec page 6: the LDM fills this privately, then clicks "Ուղարկել"
    // to publish it into the teacher's "Իմ դասի վերլուծություն" section.
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

lessonObservationSchema.index({ teacher: 1, date: -1 });
lessonObservationSchema.index({ ldm: 1, date: -1 });

module.exports = mongoose.model('LessonObservation', lessonObservationSchema);
