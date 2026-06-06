// src/middleware/rbac.js (CommonJS)

function requireRole(...roles) {
  const allowed = (roles || [])
    .map((r) => String(r || "").trim().toLowerCase())
    .filter(Boolean);

  return (req, res, next) => {
    const user = req.user || req.auth || {};
    const roleRaw = user.role ?? req.role ?? "";

    const role = String(roleRaw || "").trim().toLowerCase();

    if (!role) {
      return res.status(401).json({ ok: false, message: "Unauthorized (role missing)" });
    }

    if (allowed.length && !allowed.includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden (insufficient role)" });
    }

    return next();
  };
}

module.exports = { requireRole };
