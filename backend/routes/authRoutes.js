const express = require('express');
const { register, login, getMe, bootstrapAdmin } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { registerLimiter, loginLimiter, bootstrapLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/bootstrap-admin', bootstrapLimiter, bootstrapAdmin);
router.get('/me', protect, getMe);

module.exports = router;
