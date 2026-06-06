// src/controllers/auth.controller.js
const AuthService = require("../services/auth.service");

/* ===================== HELPERS ===================== */

function pickPassword(body) {
  return (body?.newPassword || body?.password || "").toString();
}

function requireField(value, fieldName) {
  if (value == null) return `${fieldName} is required`;
  const s = String(value).trim();
  if (!s) return `${fieldName} is required`;
  return null;
}

function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

/**
 * LOGIN payload variants supported:
 * 1) { role, identifier, password }   ✅ (your frontend)
 * 2) { role, email, password }        (older)
 * 3) { role, phone, password }        (older)
 */
function normalizeLoginBody(body = {}) {
  const role = String(body.role || "").trim();
  const password = String(body.password || "");

  const identifier = String(
    body.identifier || body.email || body.phone || body.educatorId || ""
  ).trim();

  return { role, identifier, password };
}

/* ===================== CONTROLLERS ===================== */

exports.registerStudent = async (req, res, next) => {
  try {
    const user = await AuthService.registerStudent(req.body);
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
};

exports.registerEducator = async (req, res, next) => {
  try {
    const user = await AuthService.registerEducator(req.body);
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { role, identifier, password } = normalizeLoginBody(req.body);

    const roleErr = requireField(role, "role");
    const idErr = requireField(identifier, "identifier");
    const passErr = requireField(password, "password");

    if (roleErr || idErr || passErr) {
      return res.status(400).json({
        ok: false,
        message: roleErr || idErr || passErr,
      });
    }

    const data = await AuthService.login({ role, identifier, password });

    return res.status(200).json({
      ok: true,
      ...data,
    });
  } catch (err) {
    return next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);

    const emailErr = requireField(email, "email");
    if (emailErr) {
      return res.status(400).json({ ok: false, message: emailErr });
    }

    // ✅ security: always respond generic (no user existence leak)
    await AuthService.forgotPassword(email);

    return res.status(200).json({
      ok: true,
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    const tokenErr = requireField(token, "token");
    if (tokenErr) {
      return res.status(400).json({ ok: false, message: tokenErr });
    }

    const newPassword = pickPassword(req.body).trim();
    if (!newPassword) {
      return res.status(400).json({
        ok: false,
        message: "newPassword/password is required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const data = await AuthService.resetPassword({
      token,
      newPassword,
    });

    return res.status(200).json({ ok: true, ...data });
  } catch (err) {
    return next(err);
  }
};
