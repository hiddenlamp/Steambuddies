// src/routes/educator.projectAssignments.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac");

const School = require("../../models/SchoolModel");
const Project = require("../../models/Project");
const ProjectAssignment = require("../../models/ProjectAssignment");

/* =========================
 * GET project assignments
 * ========================= */
router.get("/project-assignments", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { schoolId, classLevel, status } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (classLevel) filter.classLevel = String(classLevel);
    if (status) filter.status = status;

    const items = await ProjectAssignment.find(filter)
      .populate("projectId")
      .populate("schoolId", "_id name city state")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      items: items.map((x) => ({
        ...x,
        project: x.projectId || null,
        school: x.schoolId || null,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("GET /api/educator/project-assignments failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to load project assignments",
    });
  }
});

/* =========================
 * POST assign project
 * ========================= */
router.post("/project-assignments", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { projectId, schoolId, classLevel, status = "active" } = req.body || {};

    if (!projectId || !schoolId || !classLevel) {
      return res.status(400).json({
        ok: false,
        message: "projectId, schoolId and classLevel are required",
      });
    }

    const school = await School.findById(schoolId).lean();
    if (!school) {
      return res.status(404).json({
        ok: false,
        message: "School not found",
      });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    const existing = await ProjectAssignment.findOne({
      projectId,
      schoolId,
      classLevel: String(classLevel),
    }).lean();

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This project is already assigned to this school/class",
      });
    }

    const created = await ProjectAssignment.create({
      projectId,
      schoolId,
      classLevel: String(classLevel),
      status,
      assignedBy: req.user?._id || req.user?.id || null,
    });

    const item = await ProjectAssignment.findById(created._id)
      .populate("projectId")
      .populate("schoolId", "_id name city state")
      .lean();

    return res.status(201).json({
      ok: true,
      item: {
        ...item,
        project: item.projectId || null,
        school: item.schoolId || null,
      },
      message: "Project assigned successfully",
    });
  } catch (err) {
    console.error("POST /api/educator/project-assignments failed:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "This project is already assigned to this school/class",
      });
    }

    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to assign project",
    });
  }
});

/* =========================
 * PATCH assignment
 * ========================= */
router.patch("/project-assignments/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.classLevel !== undefined) {
      updates.classLevel = String(updates.classLevel);
    }

    const updated = await ProjectAssignment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("projectId")
      .populate("schoolId", "_id name city state")
      .lean();

    if (!updated) {
      return res.status(404).json({
        ok: false,
        message: "Project assignment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      item: {
        ...updated,
        project: updated.projectId || null,
        school: updated.schoolId || null,
      },
      message: "Project assignment updated",
    });
  } catch (err) {
    console.error("PATCH /api/educator/project-assignments/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to update project assignment",
    });
  }
});

/* =========================
 * DELETE assignment
 * ========================= */
router.delete("/project-assignments/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ProjectAssignment.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Project assignment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Project assignment deleted",
    });
  } catch (err) {
    console.error("DELETE /api/educator/project-assignments/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to delete project assignment",
    });
  }
});

module.exports = router;