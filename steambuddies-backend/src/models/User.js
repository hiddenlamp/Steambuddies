const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roles = ["student", "educator"];

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: roles, required: true },

    fullName: { type: String, required: true, trim: true },

    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },

    // student fields
    className: { type: String, trim: true },
    school: { type: String, trim: true },

    // educator fields
    educatorId: { type: String, trim: true },

    passwordHash: { type: String, required: true },

    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ educatorId: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });

userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model("User", userSchema);
