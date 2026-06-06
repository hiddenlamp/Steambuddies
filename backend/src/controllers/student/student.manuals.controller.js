// src/controllers/student.manuals.controller.js
const ManualAssignment = require("../../models/ManualAssignment.js");
const User = require("../../models/User.js");

exports.listAssignedManuals = async (req, res) => {
  try {
    const userId = req.userId;

    // ✅ student user se schoolId + classLevel nikalo
    const user = await User.findById(userId)
      .select("_id schoolId classLevel grade class")
      .lean();

    const schoolId = user?.schoolId;
    const classLevel = String(user?.classLevel || user?.grade || user?.class || "").trim();

    if (!schoolId || !classLevel) {
      return res.json({ ok: true, items: [], message: "Student school/class not set" });
    }

    const rows = await ManualAssignment.find({
      schoolId,
      classLevel,
      status: "active",
    })
      .populate("manualId", "titleEn titleHi descriptionEn descriptionHi fileUrl filePath category grade tags isPublished createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // only published manuals
    const items = rows
      .map((r) => r.manualId)
      .filter((m) => m && m.isPublished);

    return res.json({ ok: true, items, count: items.length });
  } catch (e) {
    console.error("listAssignedManuals error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
