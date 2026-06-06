// src/routes/educatorRoutes.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth.middleware.js");

// ✅ Sub-routes
const mocktestsEducatorRoutes = require("./educator/mocktests.educator.routes.js");
const educatorSchoolsRoutes = require("./educator/educator.schools.routes.js");

// ✅ Guard educator area (all below routes)
router.use(requireAuth, requireRole("educator", "admin"));

// ✅ Debug ping (protected)
router.get("/ping", (req, res) => res.json({ ok: true, role: req?.user?.role || "unknown" }));

/**
 * ✅ Mount subroutes
 * NOTE: file ke andar jo paths hain, woh relative honge.
 * Example: educator.schools.routes.js me router.get("/schools", ...) => /api/educator/schools
 */
router.use(mocktestsEducatorRoutes);
router.use(educatorSchoolsRoutes);

module.exports = router;
