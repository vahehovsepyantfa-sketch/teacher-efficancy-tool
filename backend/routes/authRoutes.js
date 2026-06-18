const express = require('express');
const { register, login, getMe, bootstrapAdmin } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/bootstrap-admin', bootstrapAdmin);
router.get('/me', protect, getMe);

module.exports = router;
