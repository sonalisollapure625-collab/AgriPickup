export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden. You do not have permission to access this resource.' },
      });
    }
    next();
  };
}
