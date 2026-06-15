const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } = require("../controllers/leave.controller");

// Educator routes
router.post("/apply", requireAuth, requireRole("educator"), applyLeave);
router.get("/my-leaves", requireAuth, requireRole("educator"), getMyLeaves);

// Admin routes
router.get("/all", requireAuth, requireRole("admin"), getAllLeaves);
router.patch("/:id/status", requireAuth, requireRole("admin"), updateLeaveStatus);

module.exports = router;
