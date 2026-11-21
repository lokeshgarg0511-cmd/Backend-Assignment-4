/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on the authenticated user's role.
 *
 * @param {...string} allowedRoles - Roles permitted to access the endpoint (e.g. 'admin', 'user')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role authorization.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Insufficient privileges. Required role: [${allowedRoles.join(', ')}], your role: [${req.user.role}].`
      });
    }

    next();
  };
};

module.exports = authorizeRoles;

