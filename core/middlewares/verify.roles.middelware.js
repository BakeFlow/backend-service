const verifyRoles = (requiredRoles) => (req, res, next) => {
  if (req.user && requiredRoles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).send({
    success: false,
    message: "You are not authorized to access this resource",
  });
};

module.exports = verifyRoles;
