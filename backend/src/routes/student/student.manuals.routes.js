// src/routes/student.manuals.routes.js
const { Router } = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth.middleware.js");
const ctrl = require("../../controllers/student/student.manuals.controller.js");

const router = Router();

// GET /api/student/manuals/assigned
router.get(
  "/manuals/assigned",
  requireAuth,
  requireRole("student"),
  ctrl.listAssignedManuals
);

module.exports = router;
