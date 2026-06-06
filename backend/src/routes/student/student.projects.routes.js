// src/routes/student.projects.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/auth.middleware");
const ProjectAssignment = require("../../models/ProjectAssignment");

router.get("/projects", requireAuth, async (req, res) => {
  try {
    const schoolId =
      req.user?.schoolId ||
      req.user?.school ||
      req.user?.student?.schoolId ||
      null;

    const classLevel = String(
      req.user?.classLevel ||
      req.user?.className ||
      req.user?.student?.classLevel ||
      ""
    ).trim();

    if (!schoolId || !classLevel) {
      return res.status(200).json({
        ok: true,
        items: [],
      });
    }

    const items = await ProjectAssignment.find({
      schoolId,
      classLevel,
      status: "active",
    })
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      items: items.map((x) => ({
        ...x,
        project: x.projectId || null,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("GET /api/student/projects failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to load student projects",
    });
  }
});

module.exports = router;