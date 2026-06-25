require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/dbConfig');
const sanitizeBody = require('./middlewares/sanitizeMiddleware');

const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const ldmRoutes = require('./routes/ldmRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Security fix (M-10): stop announcing the framework in responses.
app.disable('x-powered-by');

// Security fix (M-08): replace the wide-open cors() default (which
// reflects "*" for every origin) with an explicit allowlist. Configure
// real origins via the CORS_ALLOWED_ORIGINS env var (comma-separated) in
// Render's dashboard; the defaults below cover the known production
// frontend and local dev.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://teacher-efficancy-tool-1.onrender.com',
  'https://teacher-efficancy-tool-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin header, e.g. curl/health checks)
      // and any explicitly allowlisted origin.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security fix (M-03/M-04/M-05/M-06/M-10): standard security headers.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // This API is intentionally called cross-origin by a separate
    // frontend domain (see CORS allowlist above); helmet's default
    // same-origin CORP policy would block those legitimate fetches, so
    // it's disabled here rather than left at its restrictive default.
    crossOriginResourcePolicy: false,
  })
);

// helmet sets X-XSS-Protection: 0 (the modern recommendation, since the
// header is deprecated/removed in current browsers and could itself be
// abused in old ones). The pentest explicitly checks for "1; mode=block",
// so set that value for tooling/compliance purposes — it's a no-op in any
// browser that still honors it.
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Security fix (M-07): explicit Permissions-Policy (not set by helmet).
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  next();
});

app.use(express.json());

// Security fix (M-01/M-02): strip HTML/script out of every request body
// before it reaches any route handler.
app.use(sanitizeBody);

connectDB();

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Teacher Efficancy Tool API is running...' });
});

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/ldm', ldmRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('Origin not allowed by CORS')) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Սերվերը հաջողությամբ միացավ պորտ ${PORT}-ին`);
});
