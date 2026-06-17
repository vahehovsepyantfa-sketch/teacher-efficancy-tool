const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Ստուգում է JWT token-ը և կպցնում օգտատիրոջ տվյալները req.user-ին
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Հասանելիություն մերժված է. Token չի գտնվել' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Օգտատերը գոյություն չունի կամ ակտիվ չէ' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token-ը անվավեր է կամ ժամկետանց է' });
  }
};

module.exports = { protect };
