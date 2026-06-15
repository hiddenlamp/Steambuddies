const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } = require("../controllers/leave.controller");

// Educator routes
router.post("/apply", protect, restrictTo("educator"), applyLeave);
router.get("/my-leaves", protect, restrictTo("educator"), getMyLeaves);

// Admin routes
router.get("/all", protect, restrictTo("admin"), getAllLeaves);
router.patch("/:id/status", protect, restrictTo("admin"), updateLeaveStatus);

module.exports = router;
