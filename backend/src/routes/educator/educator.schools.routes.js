// src/routes/educator.schools.routes.js
const express = require("express");
const router = express.Router();

const School = require("../../models/SchoolModel");
const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac");

router.get("/schools", requireAuth, requireRole("educator"), async (req, res) => {
  try {
    console.log("✅ /api/educator/schools route HIT");
    console.log("req.user =", req.user);

    const query = {
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    };

    const schools = await School.find(query)
      .select("_id name city state isActive")
      .sort({ name: 1 })
      .lean();

    console.log("schools count =", schools.length);
    console.log("schools =", schools);

    return res.status(200).json({
      ok: true,
      items: schools,
      count: schools.length,
    });
  } catch (err) {
    console.error("❌ GET /api/educator/schools failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to load schools",
    });
  }
});

module.exports = router;