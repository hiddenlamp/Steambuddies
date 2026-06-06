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
    const { schoolId, classLevel, status } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (classLevel) filter.classLevel = String(classLevel);
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
    const { manualId, schoolId, classLevel, status = "active" } = req.body || {};

    console.log("POST /api/educator/manual-assignments body =", req.body);
    console.log("POST /api/educator/manual-assignments user =", req.user);

    if (!manualId || !schoolId || !classLevel) {
      return res.status(400).json({
        ok: false,
        message: "manualId, schoolId and classLevel are required",
      });
    }

    const school = await School.findById(schoolId).lean();
    if (!school) {
      return res.status(404).json({
        ok: false,
        message: "School not found",
      });
    }

    const manual = await Manual.findById(manualId).lean();
    if (!manual) {
      return res.status(404).json({
        ok: false,
        message: "Manual not found",
      });
    }

    const existing = await ManualAssignment.findOne({
      manualId,
      schoolId,
      classLevel: String(classLevel),
    }).lean();

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This manual is already assigned to this school/class",
      });
    }

    const created = await ManualAssignment.create({
      manualId,
      schoolId,
      classLevel: String(classLevel),
      status,
      assignedBy: req.user?._id || req.user?.id || null,
    });

    const item = await ManualAssignment.findById(created._id)
      .populate("manualId")
      .populate("schoolId", "_id name city state")
      .lean();

    return res.status(201).json({
      ok: true,
      item: {
        ...item,
        manual: item.manualId || null,
        school: item.schoolId || null,
      },
      message: "Manual assigned successfully",
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