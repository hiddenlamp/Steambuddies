const router = require("express").Router();
const auth = require("../controllers/auth.controller");

// ✅ Separate register routes (frontend friendly)
router.post("/register/student", auth.registerStudent);
router.post("/register/educator", auth.registerEducator);

router.post("/login", auth.login);

// forgot/reset
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

module.exports = router;
