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
    const { schoolId, classLevel, targetSchools, targetClasses } = req.query;

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
      targetSchools,
      targetClasses,
      courseId,
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

    if (!schoolsArray.length || !classesArray.length || !courseId) {
      return res.status(400).json({
        ok: false,
        message: "targetSchools, targetClasses and courseId are required",
      });
    }

    const schools = await School.find({ name: { $in: schoolsArray } }).lean();
    if (!schools.length) {
      return res.status(404).json({
        ok: false,
        message: "Schools not found",
      });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({
        ok: false,
        message: "Course not found",
      });
    }

    const createdAssignments = [];
    const skippedClasses = [];

    for (const school of schools) {
      for (const classItem of classesArray) {
        const numericClass = String(classItem).replace(/\D/g, "");

        // duplicate assignment avoid
        const existing = await CourseAssignment.findOne({
          schoolId: school._id,
          classLevel: numericClass,
          courseId,
        }).lean();

        if (existing) {
          skippedClasses.push(`${school.name} - Class ${numericClass}`);
          continue;
        }

        const created = await CourseAssignment.create({
          schoolId: school._id,
          classLevel: numericClass,
          courseId,
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
      message: `Course assigned to ${createdAssignments.length} combinations successfully.` + 
               (skippedClasses.length > 0 ? ` Skipped ${skippedClasses.length} duplicates.` : ""),
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