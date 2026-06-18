const express = require('express');
const {
  getProfile,
  createReflection,
  listMyReflections,
  listMyObservations,
  listMyEvaluations,
} = require('../controllers/teacherController');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Every route here requires a logged-in "teacher" account.
router.use(protect, allowRoles('teacher'));

router.get('/me', getProfile);
router.post('/reflections', createReflection);
router.get('/reflections', listMyReflections);
router.get('/observations', listMyObservations);
router.get('/evaluations', listMyEvaluations);

module.exports = router;
