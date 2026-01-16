const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/user.service");

exports.me = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);
  res.json({ ok: true, user });
});
