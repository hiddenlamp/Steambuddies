// src/routes/educator.manualAssignments.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac");

const School = require("../../models/SchoolModel");
const Manual = require("../../models/Manual");
const ManualAssignment = require("../../models/ManualAssignment");

/* =========================
 * GET manual assignments
 * ========================= */
router.get("/manual-assignments", requireAuth, requireRole("educator", "admin"), async (req, res) => {
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

    const items = await ManualAssignment.find(filter)
      .populate("manualId")
      .populate("schoolId", "_id name city state")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      items: items.map((x) => ({
        ...x,
        manual: x.manualId || null,
        school: x.schoolId || null,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("GET /api/educator/manual-assignments failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to load manual assignments",
    });
  }
});

/* =========================
 * POST assign manual
 * ========================= */
router.post("/manual-assignments", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const {
      targetSchools,
      targetClasses,
      manualId,
      expectedWeeks = 8,
      status = "pending",
      progressPct = 0,
    } = req.body || {};

    console.log("POST /api/educator/manual-assignments body =", req.body);
    console.log("POST /api/educator/manual-assignments user =", req.user);

    let schoolsArray = [];
    let classesArray = [];

    if (Array.isArray(targetSchools)) schoolsArray = targetSchools;
    else if (typeof targetSchools === "string") schoolsArray = JSON.parse(targetSchools || "[]");

    if (Array.isArray(targetClasses)) classesArray = targetClasses;
    else if (typeof targetClasses === "string") classesArray = JSON.parse(targetClasses || "[]");

    if (!schoolsArray.length || !classesArray.length || !manualId) {
      return res.status(400).json({
        ok: false,
        message: "targetSchools, targetClasses and manualId are required",
      });
    }

    const schools = await School.find({ name: { $in: schoolsArray } }).lean();
    if (!schools.length) {
      return res.status(404).json({
        ok: false,
        message: "Schools not found",
      });
    }

    const manual = await Manual.findById(manualId).lean();
    if (!manual) {
      return res.status(404).json({
        ok: false,
        message: "Manual not found",
      });
    }

    const createdAssignments = [];
    const skippedClasses = [];

    for (const school of schools) {
      for (const classItem of classesArray) {
        const numericClass = String(classItem).replace(/\D/g, "");

        // duplicate check
        const existing = await ManualAssignment.findOne({
          schoolId: school._id,
          classLevel: numericClass,
          manualId,
        }).lean();

        if (existing) {
          skippedClasses.push(`${school.name} - Class ${numericClass}`);
          continue;
        }

        const created = await ManualAssignment.create({
          schoolId: school._id,
          classLevel: numericClass,
          manualId,
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
      message: `Manual assigned to ${createdAssignments.length} combinations successfully.` + 
               (skippedClasses.length > 0 ? ` Skipped ${skippedClasses.length} duplicates.` : ""),
    });
  } catch (err) {
    console.error("POST /api/educator/manual-assignments failed:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "This manual is already assigned to this school/class",
        error: err.message,
      });
    }

    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to assign manual",
      error: err?.stack,
    });
  }
});

/* =========================
 * PATCH manual assignment
 * ========================= */
router.patch("/manual-assignments/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.classLevel !== undefined) {
      updates.classLevel = String(updates.classLevel);
    }

    const updated = await ManualAssignment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("manualId")
      .populate("schoolId", "_id name city state")
      .lean();

    if (!updated) {
      return res.status(404).json({
        ok: false,
        message: "Manual assignment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      item: {
        ...updated,
        manual: updated.manualId || null,
        school: updated.schoolId || null,
      },
      message: "Manual assignment updated",
    });
  } catch (err) {
    console.error("PATCH /api/educator/manual-assignments/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to update manual assignment",
    });
  }
});

/* =========================
 * DELETE manual assignment
 * ========================= */
router.delete("/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const manual = await Manual.findById(id);
    if (!manual) {
      return res.status(404).json({
        ok: false,
        message: "Manual not found",
      });
    }

    // ✅ educator/admin can delete
    await Manual.findByIdAndDelete(id);

    // optional: related assignments bhi hata do
    await ManualAssignment.deleteMany({ manualId: id });

    return res.status(200).json({
      ok: true,
      message: "Manual deleted successfully",
    });
  } catch (err) {
    console.error("DELETE /api/manuals/:id failed:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Failed to delete manual",
    });
  }
});
module.exports = router;