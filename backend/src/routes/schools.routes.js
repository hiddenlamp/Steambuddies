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

// Admin route to create a new school manually
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ ok: false, message: "School name is required" });
    
    // Check if exists
    let school = await School.findOne({ name: name.trim() });
    if (school) {
      return res.status(400).json({ ok: false, message: "School already exists" });
    }

    school = await School.create({ name: name.trim() });
    res.json({ ok: true, data: school });
  } catch (e) {
    console.error("POST /schools error:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
