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
 * Update role, active status, school/region, LDM assignment, name, or
 * reset the password. Loaded via findById + save() (rather than
 * findByIdAndUpdate) so the password is run through the model's
 * pre-save bcrypt hashing hook whenever it's included.
 */
const updateUser = async (req, res) => {
  try {
    const { role, isActive, school, region, assignedLdm, name, password } = req.body;

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (school !== undefined) user.school = school;
    if (region !== undefined) user.region = region;
    if (assignedLdm !== undefined) user.assignedLdm = assignedLdm || null;
    if (name !== undefined) user.name = name;
    if (password) user.password = password;

    await user.save();

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

/**
 * DELETE /api/admin/users/:id/permanent
 * Hard delete: actually removes the account. Refuses to delete the
 * last remaining admin (to avoid locking everyone out of the panel).
 * If the deleted user was an LDM, any teachers assigned to them are
 * unassigned first so they don't keep a dangling reference.
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last remaining admin account' });
      }
    }

    if (user.role === 'ldm') {
      await User.updateMany({ assignedLdm: user._id }, { assignedLdm: null });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

module.exports = { listUsers, createUser, updateUser, deactivateUser, deleteUser };
