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
    const { schoolId, classLevel, status, targetSchools, targetClasses } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (classLevel) filter.classLevel = String(classLevel);
    
    // Support bulk filtering
    if (targetSchools) {
      try {
        const schoolsArr = JSON.parse(targetSchools);
        if (schoolsArr.length > 0) {
          const matchedSchools = await School.find({ name: { $in: schoolsArr } }, "_id").lean();
          filter.schoolId = { $in: matchedSchools.map(s => s._id) };
        }
      } catch (e) {
        console.error("Failed to parse targetSchools:", e);
      }
    }
    
    if (targetClasses) {
      try {
        const classesArr = JSON.parse(targetClasses);
        if (classesArr.length > 0) {
          const numericClasses = classesArr.map(c => String(c).replace(/\D/g, ""));
          filter.classLevel = { $in: numericClasses };
        }
      } catch (e) {
        console.error("Failed to parse targetClasses:", e);
      }
    }
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
    const {
      targetSchools,
      targetClasses,
      projectId,
      expectedWeeks = 8,
      status = "pending",
      progressPct = 0,
    } = req.body || {};

    let schoolsArray = [];
    let classesArray = [];

    if (Array.isArray(targetSchools)) schoolsArray = targetSchools;
    else if (typeof targetSchools === "string") schoolsArray = JSON.parse(targetSchools || "[]");

    if (Array.isArray(targetClasses)) classesArray = targetClasses;
    else if (typeof targetClasses === "string") classesArray = JSON.parse(targetClasses || "[]");

    if (!schoolsArray.length || !classesArray.length || !projectId) {
      return res.status(400).json({
        ok: false,
        message: "targetSchools, targetClasses and projectId are required",
      });
    }

    const schools = await School.find({ name: { $in: schoolsArray } }).lean();
    if (!schools.length) {
      return res.status(404).json({
        ok: false,
        message: "Schools not found",
      });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    const createdAssignments = [];
    const skippedClasses = [];

    for (const school of schools) {
      for (const classItem of classesArray) {
        const numericClass = String(classItem).replace(/\D/g, "");

        // duplicate check
        const existing = await ProjectAssignment.findOne({
          schoolId: school._id,
          classLevel: numericClass,
          projectId,
        }).lean();

        if (existing) {
          skippedClasses.push(`${school.name} - Class ${numericClass}`);
          continue;
        }

        const created = await ProjectAssignment.create({
          schoolId: school._id,
          classLevel: numericClass,
          projectId,
          expectedWeeks: Number(expectedWeeks) || 8,
          status,
          progressPct: Number(progressPct) || 0,
          createdBy: req.user?._id || req.user?.id || null,
        });
        
        createdAssignments.push(created);
      }
    }

    return res.status(201).json({
      ok: true,
      createdCount: createdAssignments.length,
      skippedClasses,
      message: `Project assigned to ${createdAssignments.length} combinations successfully.` + 
               (skippedClasses.length > 0 ? ` Skipped ${skippedClasses.length} duplicates.` : ""),
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