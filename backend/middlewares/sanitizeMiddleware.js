const sanitizeHtml = require('sanitize-html');

// Security fix (M-01 / M-02 — stored XSS): strips all HTML/script markup
// from every string field in incoming request bodies before it ever
// reaches a controller or gets saved to MongoDB. None of this app's free
// text fields (names, reflections, comments, observation notes, etc.)
// are meant to contain HTML, so we disallow all tags/attributes —
// anything like <script>, <img onerror=...>, etc. is stripped down to
// plain text rather than being stored verbatim.
const SANITIZE_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return sanitizeHtml(value, SANITIZE_OPTIONS);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    out[key] = sanitizeValue(obj[key]);
  }
  return out;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = sanitizeBody;
