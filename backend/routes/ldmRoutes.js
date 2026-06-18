const express = require('express');
const {
  listMyTeachers,
  getTeacherReflections,
  createObservation,
  listObservations,
  getObservationPdf,
  createEvaluation,
  listEvaluations,
  getCompetencyMatrix,
  getEvaluationPdf,
  createNote,
  listNotes,
} = require('../controllers/ldmController');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// LDMs (and admins, who can act as a substitute coach) use this surface.
router.use(protect, allowRoles('ldm', 'admin'));

router.get('/teachers', listMyTeachers);
router.get('/teachers/:id/reflections', getTeacherReflections);

router.post('/observations', createObservation);
router.get('/observations', listObservations);
router.get('/observations/:id/pdf', getObservationPdf);

router.post('/evaluations', createEvaluation);
router.get('/evaluations', listEvaluations);
router.get('/evaluations/matrix', getCompetencyMatrix);
router.get('/evaluations/:id/pdf', getEvaluationPdf);

router.post('/notes', createNote);
router.get('/notes', listNotes);

module.exports = router;
