// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roles = ["student", "educator", "admin"];

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: roles, required: true, index: true },

    fullName: { type: String, required: true, trim: true },

    // ✅ Global unique email (lowercase + trim)
    email: { type: String, required: true, lowercase: true, trim: true },

    phone: { type: String, trim: true, default: null },

    /* ===================== STUDENT ===================== */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },

    school: { type: String, trim: true, default: "" },

    classLevel: { type: String, trim: true, default: "", index: true },
    className: { type: String, trim: true, default: "" },

    /* ===================== EDUCATOR ===================== */
    educatorId: { type: String, trim: true, default: undefined },
    assignedSchools: [{ type: String, trim: true }],

    /* ===================== AUTH ===================== */
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, default: null, select: false },

    /* ===================== FORGOT / RESET ===================== */
    // ✅ store HASHED reset token + expiry (one-time)
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExp: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

/* ===================== INDEXES ===================== */

// ✅ Global unique email (case-insensitive handling via lowercase)
userSchema.index({ email: 1 }, { unique: true });

// ✅ Unique educatorId ONLY when educatorId exists and not empty
userSchema.index(
  { educatorId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      educatorId: { $exists: true, $type: "string", $ne: "" },
    },
  }
);

// ✅ Optional: phone indexed (not unique)
userSchema.index({ phone: 1 }, { sparse: true });

/* ===================== METHODS ===================== */

userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(String(password || ""), this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(String(password || ""), salt);
};

module.exports = mongoose.model("User", userSchema);
