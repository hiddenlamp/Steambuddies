// src/controllers/educator.schools.controller.js
const School = require("../../models/SchoolModel.js");

// GET /api/educator/schools
exports.listSchools = async (req, res) => {
  try {
    // ✅ educator ke according filter (recommended)
    const educatorId = req.userId; // requireAuth middleware attaches this

    const schools = await School.find({ educatorId, isActive: true })
      .select("_id name code city state isActive")
      .sort({ name: 1 })
      .lean();

    return res.json({
      ok: true,
      items: schools,
      count: schools.length,
    });
  } catch (e) {
    console.error("listSchools error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
