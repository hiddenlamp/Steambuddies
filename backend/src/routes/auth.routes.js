const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth.controller");

/* ===================== REGISTER ===================== */
// ✅ Separate register routes (frontend friendly)
router.post("/register/student", auth.registerStudent);
router.post("/register/educator", auth.registerEducator);

/* ===================== AUTH ===================== */
router.post("/login", auth.login);

/* ===================== PASSWORD RESET ===================== */
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

module.exports = router;
