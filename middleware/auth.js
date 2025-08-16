const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check if user has specific role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole('ADMIN');

// Family only middleware  
const requireFamily = requireRole('FAMILY');

// Donor only middleware
const requireDonor = requireRole('DONOR');

// Admin or Family middleware
const requireAdminOrFamily = requireRole('ADMIN', 'FAMILY');

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireFamily,
  requireDonor,
  requireAdminOrFamily
};