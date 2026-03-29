const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Support JWT in Authorization header or X-Auth-Token (when tunnel basic auth is used)
    let authHeader = req.headers.authorization;
    const xAuthToken = req.headers['x-auth-token'];
    if (xAuthToken && xAuthToken.startsWith('Bearer ')) {
      authHeader = xAuthToken;
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [{ model: Permission, as: 'permissions' }],
        },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// RBAC: Check if user has specific role
const requireRole = (...roleNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRoles = req.user.roles.map((r) => r.name);
    const hasRole = roleNames.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message: 'Access denied. Required role: ' + roleNames.join(' or '),
      });
    }

    next();
  };
};

// RBAC: Check if user has specific permission
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userPermissions = [];
    req.user.roles.forEach((role) => {
      role.permissions.forEach((perm) => {
        userPermissions.push({ resource: perm.resource, action: perm.action });
      });
    });

    const hasPermission = userPermissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === 'manage')
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${action} on ${resource}`,
      });
    }

    next();
  };
};

module.exports = { authenticate, requireRole, requirePermission };
