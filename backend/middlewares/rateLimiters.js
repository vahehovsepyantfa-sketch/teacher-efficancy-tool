const rateLimit = require('express-rate-limit');

/**
 * Security fix (C-01): the registration endpoint had no rate limiting,
 * allowing unlimited automated account creation (mass-account-creation /
 * abuse / DoS risk). Limits each IP to a small number of registration
 * attempts per hour.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again later.' },
});

/**
 * Defense-in-depth: throttle login attempts per IP to slow down
 * credential-stuffing / brute-force attempts against POST /api/auth/login.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

/**
 * The one-time admin-bootstrap route is unauthenticated by design (it only
 * works while zero admins exist), so it gets the same strict limit as
 * registration.
 */
const bootstrapLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

module.exports = { registerLimiter, loginLimiter, bootstrapLimiter };
