// Թույլատրում է հասանելիություն միայն նշված role(s)-ով օգտատերերին
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Այս գործողության համար բավարար իրավունքներ չունեք' });
    }
    next();
  };
};

module.exports = { allowRoles };
