const express = require("express");
const router = express.Router();
const School = require("../models/SchoolModel");
const { requireAuth } = require("../middleware/auth.middleware");

// Global route to get all active schools
router.get("/", requireAuth, async (req, res) => {
  try {
    const schools = await School.find({ isActive: true }).select("_id name code city state").sort({ name: 1 }).lean();
    res.json({ ok: true, data: schools });
  } catch (e) {
    console.error("GET /schools error:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
