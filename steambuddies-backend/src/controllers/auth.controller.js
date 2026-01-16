const AuthService = require("../services/auth.service");

exports.registerStudent = async (req, res, next) => {
  try {
    const user = await AuthService.registerStudent(req.body);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.registerEducator = async (req, res, next) => {
  try {
    const user = await AuthService.registerEducator(req.body);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await AuthService.login(req.body);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await AuthService.forgotPassword(email);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, newPassword } = req.body;
    // ✅ frontend sometimes sends password, sometimes newPassword
    const finalPassword = newPassword || password;

    const data = await AuthService.resetPassword({ token, newPassword: finalPassword });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};
