exports.checkRole = (...allowedRoles) => { //checkRole('seller', 'admin')
  return (req, res, next) => {
    try {
      const userRole = req.user.role; 
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: 'Role validation error', error: error.message });
    }
  };
};
