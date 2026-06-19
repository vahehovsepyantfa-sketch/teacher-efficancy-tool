const express = require('express');
const {
  generateFeedbackForReflection,
  classifyManifestation,
  listManifestations,
  suggestScores,
} = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// Any logged-in user can request feedback on a reflection; the controller
// itself checks that they own it (or are an ldm/admin).
router.post('/reflections/:id/feedback', generateFeedbackForReflection);

// Manifestation-sorting chat: type one observed behavior, AI classifies it
// into one of the 18 fixed leadership competencies and lands it in that
// competency's notes field on the Competency Matrix.
router.post('/manifestations', allowRoles('ldm', 'admin'), classifyManifestation);
router.get('/manifestations', allowRoles('ldm', 'admin'), listManifestations);

// Competency Matrix: AI suggests a 0-5 score for every row that already
// has notes/comments, staying manually editable afterward.
router.post('/competencies/suggest-scores', allowRoles('ldm', 'admin'), suggestScores);

module.exports = router;
