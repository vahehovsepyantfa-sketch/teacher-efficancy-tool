/**
 * Restricts a route to one or more roles. Must run after authMiddleware.protect,
 * which attaches req.user.
 *
 * Usage: router.get('/admin-only', protect, allowRoles('admin'), handler)
 */
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Role '${req.user.role}' is not permitted to perform this action`,
    });
  }

  next();
};

module.exports = { allowRoles };
