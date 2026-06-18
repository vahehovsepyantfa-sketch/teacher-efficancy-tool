const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT on the request, loads the corresponding user
 * (without the password hash), and attaches it to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authorized, user not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { protect };
