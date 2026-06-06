// src/routes/educator.assignments.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac");

const CourseAssignment = require("../../models/courseAssignment.model");
const Course = require("../../models/course.model");
const School = require("../../models/SchoolModel");

/* ---------------- GET assignments ---------------- */
router.get("/assignments", requireAuth, requireRole("educator"), async (req, res) => {
  try {
    const { schoolId, classLevel } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (classLevel) filter.classLevel = String(classLevel);

    const items = await CourseAssignment.find(filter)
      .populate("courseId")
      .populate("schoolId", "_id name")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = items.map((a) => ({
      ...a,
      course: a.courseId || null,
      school: a.schoolId || null,
    }));

    return res.status(200).json({
      ok: true,
      items: normalized,
      count: normalized.length,
    });
  } catch (err) {
    console.error("GET /api/educator/assignments failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to load assignments",
    });
  }
});

/* ---------------- POST assign course ---------------- */
router.post("/assignments", requireAuth, requireRole("educator"), async (req, res) => {
  try {
    const {
      schoolId,
      classLevel,
      courseId,
      expectedWeeks = 8,
      status = "pending",
      progressPct = 0,
    } = req.body || {};

    if (!schoolId || !classLevel || !courseId) {
      return res.status(400).json({
        ok: false,
        message: "schoolId, classLevel and courseId are required",
      });
    }

    const school = await School.findById(schoolId).lean();
    if (!school) {
      return res.status(404).json({
        ok: false,
        message: "School not found",
      });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({
        ok: false,
        message: "Course not found",
      });
    }

    // duplicate assignment avoid
    const existing = await CourseAssignment.findOne({
      schoolId,
      classLevel: String(classLevel),
      courseId,
    }).lean();

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This course is already assigned to this school/class",
      });
    }

    const created = await CourseAssignment.create({
      schoolId,
      classLevel: String(classLevel),
      courseId,
      expectedWeeks: Number(expectedWeeks) || 8,
      status,
      progressPct: Number(progressPct) || 0,
      createdBy: req.user?._id || req.user?.id || null,
    });

    const item = await CourseAssignment.findById(created._id)
      .populate("courseId")
      .populate("schoolId", "_id name")
      .lean();

    return res.status(201).json({
      ok: true,
      item: {
        ...item,
        course: item.courseId || null,
        school: item.schoolId || null,
      },
      message: "Course assigned successfully",
    });
  } catch (err) {
    console.error("POST /api/educator/assignments failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to assign course",
    });
  }
});

/* ---------------- PATCH assignment ---------------- */
router.patch("/assignments/:id", requireAuth, requireRole("educator"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.classLevel !== undefined) {
      updates.classLevel = String(updates.classLevel);
    }
    if (updates.expectedWeeks !== undefined) {
      updates.expectedWeeks = Number(updates.expectedWeeks) || 0;
    }
    if (updates.progressPct !== undefined) {
      updates.progressPct = Math.max(0, Math.min(100, Number(updates.progressPct) || 0));
    }

    const updated = await CourseAssignment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("courseId")
      .populate("schoolId", "_id name")
      .lean();

    if (!updated) {
      return res.status(404).json({
        ok: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      item: {
        ...updated,
        course: updated.courseId || null,
        school: updated.schoolId || null,
      },
      message: "Assignment updated",
    });
  } catch (err) {
    console.error("PATCH /api/educator/assignments/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to update assignment",
    });
  }
});

/* ---------------- DELETE assignment ---------------- */
router.delete("/assignments/:id", requireAuth, requireRole("educator"), async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await CourseAssignment.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Assignment deleted",
    });
  } catch (err) {
    console.error("DELETE /api/educator/assignments/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to delete assignment",
    });
  }
});

module.exports = router;