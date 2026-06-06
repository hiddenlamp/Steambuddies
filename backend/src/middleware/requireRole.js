// src/middleware/requireRole.js
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    next();
  };
};
