const User = require('../models/User');
const { ROLES } = require('../models/User');

/**
 * GET /api/admin/users
 */
const listUsers = async (req, res) => {
  const users = await User.find().populate('assignedLdm', 'name email').sort({ createdAt: -1 });
  res.json({ users });
};

/**
 * POST /api/admin/users
 * Admin-created accounts can be given any role directly.
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, school, region, assignedLdm } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'teacher',
      school,
      region,
      assignedLdm: assignedLdm || null,
    });

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Update role, active status, school/region, or LDM assignment.
 */
const updateUser = async (req, res) => {
  try {
    const { role, isActive, school, region, assignedLdm, name } = req.body;

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
    }

    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    if (school !== undefined) update.school = school;
    if (region !== undefined) update.region = region;
    if (assignedLdm !== undefined) update.assignedLdm = assignedLdm || null;
    if (name !== undefined) update.name = name;

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Soft delete: deactivate rather than remove, so historical
 * observations/evaluations/reflections keep a valid reference.
 */
const deactivateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user: user.toSafeObject() });
};

module.exports = { listUsers, createUser, updateUser, deactivateUser };
