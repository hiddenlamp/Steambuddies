// services/auth.service.js
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const School = require("../models/SchoolModel");

const AppError = require("../utils/AppError");
const { sha256 } = require("../utils/crypto");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");
const { sendMail } = require("./mail.service");

/* ------------------ helpers ------------------ */
function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u._id,
    role: u.role,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,

    // student
    classLevel: u.classLevel || u.className || "",
    className: u.className || "",
    schoolId: u.schoolId || null,
    school: u.school || "",

    // educator
    educatorId: u.educatorId || null,

    createdAt: u.createdAt,
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function normalizeText(v) {
  return String(v || "").trim();
}
function requireText(v, name) {
  const s = normalizeText(v);
  if (!s) throw new AppError(`${name} is required`, 400);
  return s;
}
function requirePassword(pwd) {
  const p = String(pwd || "");
  if (!p) throw new AppError("Password is required", 400);
  if (p.length < 6) throw new AppError("Password must be at least 6 characters", 400);
  return p;
}

function toObjectIdMaybe(id) {
  if (!id) return null;
  const s = String(id).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

async function resolveSchool(payload) {
  const schoolIdInput = payload?.schoolId || payload?.school_id;
  const schoolNameInput = payload?.school || payload?.schoolName || payload?.school_name;

  // 1) if schoolId provided
  const oid = toObjectIdMaybe(schoolIdInput);
  if (oid) {
    const found = await School.findById(oid).lean();
    if (!found) throw new AppError("Invalid schoolId", 400);
    return { schoolId: found._id, school: found.name };
  }

  // 2) try by school name
  const schoolName = normalizeText(schoolNameInput);
  if (!schoolName) return { schoolId: null, school: "" };

  let sch = await School.findOne({ name: schoolName }).lean();
  if (!sch) {
    const created = await School.create({ name: schoolName });
    sch = created.toObject();
  }

  return { schoolId: sch._id, school: sch.name };
}

function buildTokenPayload(user) {
  const payload = {
    sub: user._id.toString(),
    id: user._id.toString(),
    role: user.role,
  };

  if (user.role === "student") {
    payload.schoolId = user.schoolId ? user.schoolId.toString() : null;
    payload.classLevel = user.classLevel || user.className || "";
  }

  return payload;
}

function getResetExpiryMs() {
  const mins = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 15);
  return mins * 60 * 1000;
}

/**
 * ✅ IMPORTANT: APP_URL must be only ONE base url
 * Local: http://localhost:5173
 * Prod : https://steambuddies.vercel.app
 */
function buildResetLink(token) {
  const base = String(process.env.APP_URL || "").trim().replace(/\/+$/, "");
  if (!base) throw new AppError("APP_URL missing in env", 500);
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

function requireResetSecret() {
  const secret = String(process.env.JWT_RESET_SECRET || "").trim();
  if (!secret) throw new AppError("JWT_RESET_SECRET missing in env", 500);
  return secret;
}

/* ------------------ REGISTER STUDENT ------------------ */
async function registerStudent(payload) {
  if (payload) {
    delete payload.educatorId;
    delete payload.educator_id;
  }

  const email = normalizeEmail(payload?.email);
  if (!email) throw new AppError("Email is required", 400);

  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  const password = requirePassword(payload?.password);
  const passwordHash = await User.hashPassword(password);

  const classLevel = normalizeText(payload?.classLevel || payload?.className || payload?.class);
  if (!classLevel) throw new AppError("class is required", 400);

  const { schoolId, school } = await resolveSchool(payload);
  if (!schoolId) throw new AppError("school is required", 400);

  const fullName = requireText(payload?.fullName, "fullName");
  const phone = normalizeText(payload?.phone);

  const user = await User.create({
    role: "student",
    fullName,
    email,
    phone,
    classLevel,
    className: classLevel,
    schoolId,
    school,
    passwordHash,
  });

  return sanitizeUser(user);
}

/* ------------------ REGISTER EDUCATOR ------------------ */
async function registerEducator(payload) {
  const email = normalizeEmail(payload?.email);
  if (!email) throw new AppError("Email is required", 400);

  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  const password = requirePassword(payload?.password);
  const passwordHash = await User.hashPassword(password);

  const fullName = requireText(payload?.fullName, "fullName");
  const educatorId = requireText(payload?.educatorId || payload?.educator_id, "educatorId");

  const user = await User.create({
    role: "educator",
    fullName,
    email,
    educatorId,
    passwordHash,
  });

  return sanitizeUser(user);
}

/* ------------------ LOGIN ------------------ */
async function login(payload) {
  const role = normalizeText(payload?.role);
  const identifier = requireText(payload?.identifier, "Identifier");
  const password = requirePassword(payload?.password);

  if (role !== "student" && role !== "educator" && role !== "admin") {
    throw new AppError("Invalid role", 400);
  }

  let user = null;
  const email = normalizeEmail(identifier);

  if (role === "student") {
    user = await User.findOne({
      role: "student",
      $or: [{ email }, { phone: identifier }],
    }).select("+passwordHash +refreshTokenHash");
  } else if (role === "educator") {
    user = await User.findOne({
      role: "educator",
      $or: [{ email }, { educatorId: identifier }],
    }).select("+passwordHash +refreshTokenHash");
  } else if (role === "admin") {
    user = await User.findOne({
      role: "admin",
      email,
    }).select("+passwordHash +refreshTokenHash");
  }

  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await user.verifyPassword(password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const tokenPayload = buildTokenPayload(user);

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

/* ------------------ FORGOT PASSWORD ------------------ */
async function forgotPassword(emailInput) {
  const email = normalizeEmail(emailInput);
  if (!email) throw new AppError("Email is required", 400);

  const user = await User.findOne({ email }).select("+resetTokenHash +resetTokenExp");
  // ✅ security: do not reveal existence
  if (!user) return { message: "If the email exists, a reset link has been sent." };

  const secret = requireResetSecret();

  const expiresMin = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 15);

  const resetToken = jwt.sign(
    { uid: user._id.toString() },
    secret,
    { expiresIn: `${expiresMin}m` }
  );

  user.resetTokenHash = sha256(resetToken);
  user.resetTokenExp = new Date(Date.now() + getResetExpiryMs());
  await user.save();

  const link = buildResetLink(resetToken);

  await sendMail({
    to: user.email,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Forgot Password</h2>
        <p>Hi ${user.fullName || "there"},</p>
        <p>Click the button below to reset your password:</p>

        <p style="margin:20px 0;">
          <a href="${link}"
            style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;">
            Reset Password
          </a>
        </p>

        <p style="font-size:12px;color:#777">If button doesn't work, copy paste this link:</p>
        <p style="font-size:12px;word-break:break-all">${link}</p>

        <p style="color:#777;font-size:12px">
          This link expires in ${expiresMin} minutes. If you didn't request it, ignore this email.
        </p>
      </div>
    `,
  });

  return { message: "If the email exists, a reset link has been sent." };
}

/* ------------------ RESET PASSWORD ------------------ */
async function resetPassword({ token, newPassword }) {
  const t = normalizeText(token);
  if (!t) throw new AppError("token is required", 400);

  const pwd = requirePassword(newPassword);

  const secret = requireResetSecret();

  let decoded;
  try {
    decoded = jwt.verify(t, secret);
  } catch (e) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const uid = decoded?.uid;
  if (!uid || !mongoose.Types.ObjectId.isValid(uid)) {
    throw new AppError("Invalid reset token", 400);
  }

  const user = await User.findById(uid).select("+resetTokenHash +resetTokenExp +passwordHash +refreshTokenHash");
  if (!user) throw new AppError("Invalid reset token", 400);

  const tokenHash = sha256(t);

  if (!user.resetTokenHash || user.resetTokenHash !== tokenHash) {
    throw new AppError("Invalid or already used reset token", 400);
  }
  if (!user.resetTokenExp || user.resetTokenExp.getTime() < Date.now()) {
    throw new AppError("Reset token expired", 400);
  }

  user.passwordHash = await User.hashPassword(pwd);

  // ✅ clear reset token (one-time use)
  user.resetTokenHash = null;
  user.resetTokenExp = null;

  // ✅ optional: logout from all devices after password change
  user.refreshTokenHash = null;

  await user.save();

  return { message: "Password updated successfully" };
}

module.exports = {
  registerStudent,
  registerEducator,
  login,
  forgotPassword,
  resetPassword,
};
