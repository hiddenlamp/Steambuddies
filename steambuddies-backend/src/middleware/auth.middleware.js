// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const xToken = req.headers["x-access-token"];

  if (xToken && String(xToken).trim()) return String(xToken).trim();
  if (!authHeader) return "";

  const parts = String(authHeader).trim().split(/\s+/);

  // Bearer <token>
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];

  // token directly
  return String(authHeader).trim();
}

exports.requireAuth = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Token missing. Please login again." });
    }

    // ✅ IMPORTANT: verify access token with ACCESS secret
    const secret =
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET; // fallback if you ever switch

    if (!secret) {
      console.error("❌ JWT_ACCESS_SECRET / JWT_SECRET missing in .env");
      return res.status(500).json({ message: "Server misconfigured (JWT secret missing)" });
    }

    const payload = jwt.verify(token, secret);

    const id = payload?.id || payload?._id || payload?.userId;
    if (!id) return res.status(401).json({ message: "Invalid token payload" });

    req.user = payload;
    req.userId = id;

    return next();
  } catch (e) {
    if (e?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    console.error("❌ Invalid token:", e?.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ message: "Forbidden" });

  const allowed = roles.map((r) => String(r).toLowerCase());
  if (!allowed.includes(String(role).toLowerCase())) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};
