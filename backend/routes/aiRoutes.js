const express = require('express');
const {
  generateFeedbackForReflection,
  generateTeacherDiary,
  listTeacherDiary,
  classifyManifestation,
  listManifestations,
} = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// Any logged-in user can request feedback on a reflection; the controller
// itself checks that they own it (or are an ldm/admin).
router.post('/reflections/:id/feedback', generateFeedbackForReflection);

// Diary generation/viewing is an LDM/admin coaching tool.
router.post('/diary', allowRoles('ldm', 'admin'), generateTeacherDiary);
router.get('/diary', allowRoles('ldm', 'admin'), listTeacherDiary);

// Manifestation-sorting chat: type one observed behavior, AI classifies it
// into one of the 18 fixed leadership competencies.
router.post('/manifestations', allowRoles('ldm', 'admin'), classifyManifestation);
router.get('/manifestations', allowRoles('ldm', 'admin'), listManifestations);

module.exports = router;
