const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/register
 * Open self-registration. New accounts default to the "teacher" role —
 * an admin can later promote someone to "ldm" or "admin" via the
 * admin/users endpoints.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, school, region } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      // L-03 fix: generic message that doesn't confirm whether the email
      // is already registered (mitigates user-enumeration via registration).
      return res.status(400).json({ message: 'Unable to complete registration with the provided details' });
    }

    const user = await User.create({
      name,
      email,
      password,
      school,
      region,
      role: 'teacher',
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid registration details', error: err.message });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};


/**
 * POST /api/auth/bootstrap-admin
 * One-time, self-disabling bootstrap route: creates the very first admin
 * account. Only works while zero admin accounts exist in the database.
 * Once an admin exists, this route always returns 403.
 */
const bootstrapAdmin = async (req, res) => {
  try {
    const existingAdminCount = await User.countDocuments({ role: 'admin' });
    if (existingAdminCount > 0) {
      return res.status(403).json({ message: 'An admin account already exists; bootstrap is disabled' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Unable to complete bootstrap with the provided details' });
    }

    const user = await User.create({ name, email, password, role: 'admin' });
    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid bootstrap details', error: err.message });
    }
    res.status(500).json({ message: 'Bootstrap failed' });
  }
};

module.exports = { register, login, getMe, bootstrapAdmin };
