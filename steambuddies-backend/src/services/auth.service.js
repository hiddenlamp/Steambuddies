// services/auth.service.js
const User = require("../models/User");
const Reset = require("../models/PasswordResetToken");
const bcrypt = require("bcryptjs");

const AppError = require("../utils/AppError");
const { sha256, randomToken } = require("../utils/crypto");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");
const { sendMail } = require("./mail.service");

/* ------------------ helpers ------------------ */
function sanitizeUser(u) {
  return {
    id: u._id,
    role: u.role,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    className: u.className,
    school: u.school,
    educatorId: u.educatorId,
    createdAt: u.createdAt,
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeIdentifier(identifier) {
  return String(identifier || "").trim();
}

/* ------------------ REGISTER ------------------ */
async function registerStudent(payload) {
  const email = normalizeEmail(payload.email);
  if (!email) throw new AppError("Email is required", 400);

  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  if (!payload.password || String(payload.password).length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const passwordHash = await User.hashPassword(payload.password);

  const user = await User.create({
    role: "student",
    fullName: String(payload.fullName || "").trim(),
    email,
    phone: String(payload.phone || "").trim(),
    className: String(payload.className || "").trim(),
    school: String(payload.school || "").trim(),
    passwordHash,
  });

  return sanitizeUser(user);
}

async function registerEducator(payload) {
  const email = normalizeEmail(payload.email);
  if (!email) throw new AppError("Email is required", 400);

  const educatorId = String(payload.educatorId || "").trim();
  if (!educatorId) throw new AppError("Educator ID is required", 400);

  const existsEmail = await User.findOne({ email });
  if (existsEmail) throw new AppError("Email already registered", 409);

  const existsId = await User.findOne({ educatorId });
  if (existsId) throw new AppError("Educator ID already exists", 409);

  if (!payload.password || String(payload.password).length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const passwordHash = await User.hashPassword(payload.password);

  const user = await User.create({
    role: "educator",
    fullName: String(payload.fullName || "").trim(),
    email,
    educatorId,
    passwordHash,
  });

  return sanitizeUser(user);
}

/* ------------------ LOGIN ------------------ */
async function login({ role, identifier, password }) {
  const idf = normalizeIdentifier(identifier);
  const pass = String(password || "");

  if (!idf || !pass) throw new AppError("Identifier and password are required", 400);

  let user = null;

  if (role === "student") {
    const email = normalizeEmail(idf);
    user = await User.findOne({
      role: "student",
      $or: [{ email }, { phone: idf }],
    });
  } else {
    const email = normalizeEmail(idf);
    user = await User.findOne({
      role: "educator",
      $or: [{ email }, { educatorId: idf }],
    });
  }

  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await user.verifyPassword(pass);
  if (!ok) throw new AppError("Invalid credentials", 401);

  // ✅ include both sub and id (matches middleware expectations)
  const tokenPayload = {
    sub: user._id.toString(),
    id: user._id.toString(),
    role: user.role,
  };

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
async function forgotPassword(email) {
  const cleanEmail = normalizeEmail(email);

  // 🔐 Security: always return success
  const user = await User.findOne({ email: cleanEmail });
  if (!user) return { sent: true };

  // ✅ Optional but recommended: remove old unused tokens
  await Reset.deleteMany({ userId: user._id, usedAt: null });

  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);

  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 15);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await Reset.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  const client = String(process.env.CLIENT_URL || "").replace(/\/+$/, "");
  const resetLink = `${client}/reset-password?token=${rawToken}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Reset your SteamBuddies password</h2>
      <p>Click the button below to reset your password.</p>
      <p>This link will expire in ${minutes} minutes.</p>
      <a href="${resetLink}"
         style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;
                text-decoration:none;border-radius:10px;font-weight:bold;">
        Reset Password
      </a>
      <p style="margin-top:16px">If you did not request this, ignore this email.</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: "SteamBuddies – Password Reset",
    html,
  });

  return { sent: true };
}

/* ------------------ RESET PASSWORD ------------------ */
async function resetPassword({ token, newPassword }) {
  const raw = String(token || "").trim();
  const pwd = String(newPassword || "");

  if (!raw) throw new AppError("Token is required", 400);
  if (!pwd || pwd.length < 6) throw new AppError("Password must be at least 6 characters", 400);

  const tokenHash = sha256(raw);

  const record = await Reset.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) throw new AppError("Reset link invalid or expired", 400);

  const user = await User.findById(record.userId);
  if (!user) throw new AppError("User not found", 404);

  user.passwordHash = await User.hashPassword(pwd);
  user.refreshTokenHash = null; // 🔐 logout all sessions
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return { ok: true };
}

module.exports = {
  registerStudent,
  registerEducator,
  login,
  forgotPassword,
  resetPassword,
};
