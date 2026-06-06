// src/middleware/auth.middleware.js
// ✅ Production-clean:
// - supports x-access-token + Authorization (Bearer or direct token)
// - verifies JWT with JWT_ACCESS_SECRET (fallback JWT_SECRET)
// - loads fresh user from DB (no password)
// - attaches: req.auth, req.userId, req.userIdObj, req.user
// - role guard: requireRole("educator","admin")

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// ---------------- helpers ----------------
function headerValue(req, name) {
  if (!req || !req.headers) return "";
  const v = req.headers[String(name || "").toLowerCase()];
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

function cleanStr(v) {
  return String(v || "").trim();
}

function extractToken(req) {
  // 1) X-Access-Token
  const xToken = cleanStr(headerValue(req, "x-access-token"));
  if (xToken && xToken !== "null" && xToken !== "undefined") return xToken;

  // 2) Authorization
  const auth = cleanStr(headerValue(req, "authorization"));
  if (!auth) return "";

  // Bearer <token>
  const parts = auth.split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return cleanStr(parts[1]);

  // direct token
  return auth;
}

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "";
}

function normalizeIdFromPayload(payload) {
  return payload?.id || payload?._id || payload?.userId || payload?.sub || null;
}

function toObjectId(id) {
  const s = cleanStr(id);
  if (!s) return null;
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

// ---------------- middleware ----------------
exports.requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Token missing. Please login again.",
      });
    }

    const secret = getAccessSecret();
    if (!secret) {
      console.error("❌ JWT_ACCESS_SECRET / JWT_SECRET missing in .env");
      return res.status(500).json({
        ok: false,
        message: "Server misconfigured (JWT secret missing)",
      });
    }

    // verify token
    const payload = jwt.verify(token, secret);

    // user id from payload
    const idRaw = normalizeIdFromPayload(payload);
    const userIdObj = toObjectId(idRaw);
    if (!userIdObj) {
      return res.status(401).json({ ok: false, message: "Invalid token payload" });
    }

    // fetch user fresh (no password)
    const user = await User.findById(userIdObj).select("-password").lean();
    if (!user) {
      return res.status(401).json({ ok: false, message: "User not found" });
    }

    // Attach raw jwt
    req.auth = payload;

    // Attach ids
    req.userIdObj = user._id;
    req.userId = user._id.toString();

    // Attach normalized user
    req.user = {
      ...user,
      id: user._id.toString(),
      _id: user._id,

      schoolId: user.schoolId || null,
      school: user.school || "",
      classLevel: user.classLevel || user.className || "",
      className: user.className || "",
    };

    return next();
  } catch (e) {
    if (e?.name === "TokenExpiredError") {
      return res.status(401).json({ ok: false, message: "Token expired. Please login again." });
    }
    if (e?.name === "JsonWebTokenError") {
      return res.status(401).json({ ok: false, message: "Invalid token" });
    }

    console.error("❌ Auth middleware error:", e);
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
};

exports.requireRole = (...roles) => {
  const allowed = roles.map((r) => cleanStr(r).toLowerCase()).filter(Boolean);

  return (req, res, next) => {
    const role = cleanStr(req.user?.role).toLowerCase();

    if (!role) return res.status(403).json({ ok: false, message: "Forbidden" });
    if (!allowed.includes(role)) return res.status(403).json({ ok: false, message: "Forbidden" });

    return next();
  };
};
