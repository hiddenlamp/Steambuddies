const User = require("../models/User");
const AppError = require("../utils/AppError");

async function getMe(userId) {
  const user = await User.findById(userId).select("-passwordHash -refreshTokenHash");
  if (!user) throw new AppError("User not found", 404);
  return user;
}

module.exports = { getMe };
