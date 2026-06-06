// src/controllers/educator.manualAssignments.controller.js
const mongoose = require("mongoose");
const ManualAssignment = require("../../models/ManualAssignment.js");
const School = require("../../models/SchoolModel.js");

function toObjId(id) {
  if (!id) return null;
  const s = String(id).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function getEducatorId(req) {
  // prefer req.userId from your auth middleware
  return req.userId || req.user?._id || req.userIdObj;
}

/**
 * GET /api/educator/manual-assignments?schoolId=&classLevel=
 */
exports.listAssignments = async (req, res) => {
  try {
    const educatorIdRaw = getEducatorId(req);
    const educatorId = toObjId(educatorIdRaw);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const { schoolId, classLevel } = req.query;

    const filter = { educatorId };
    const sid = toObjId(schoolId);
    if (sid) filter.schoolId = sid;
    if (classLevel) filter.classLevel = String(classLevel).trim();

    const items = await ManualAssignment.find(filter)
      .populate({
        path: "manualId",
        select: "_id titleEn titleHi category grade tags fileUrl url isPublished createdAt",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, items, count: items.length });
  } catch (e) {
    console.error("listAssignments error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * POST /api/educator/manual-assignments
 * body: { manualId, schoolId, classLevel, status }
 */
exports.assignManual = async (req, res) => {
  try {
    const educatorIdRaw = getEducatorId(req);
    const educatorId = toObjId(educatorIdRaw);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const { schoolId, classLevel, manualId, status } = req.body;

    const sid = toObjId(schoolId);
    const mid = toObjId(manualId);
    const cls = String(classLevel || "").trim();

    if (!sid || !mid || !cls) {
      return res
        .status(400)
        .json({ ok: false, message: "schoolId, classLevel, manualId are required" });
    }

    // ✅ security: educator can assign only his own school
    const school = await School.findOne({ _id: sid, educatorId }).select("_id").lean();
    if (!school) {
      return res.status(403).json({ ok: false, message: "Invalid school for this educator" });
    }

    const doc = await ManualAssignment.create({
      educatorId,
      schoolId: sid,
      classLevel: cls,
      manualId: mid,
      status: status || "active",
    });

    return res.json({ ok: true, item: doc });
  } catch (e) {
    if (e?.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, message: "This manual already assigned to this School + Class" });
    }
    console.error("assignManual error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * PATCH /api/educator/manual-assignments/:id
 * body: { status }
 */
exports.updateAssignment = async (req, res) => {
  try {
    const educatorIdRaw = getEducatorId(req);
    const educatorId = toObjId(educatorIdRaw);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid assignment id" });

    const { status } = req.body;
    const patch = {};
    if (status) patch.status = status;

    const updated = await ManualAssignment.findOneAndUpdate(
      { _id: id, educatorId },
      patch,
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ ok: false, message: "Assignment not found" });
    return res.json({ ok: true, item: updated });
  } catch (e) {
    console.error("updateAssignment error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * DELETE /api/educator/manual-assignments/:id
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const educatorIdRaw = getEducatorId(req);
    const educatorId = toObjId(educatorIdRaw);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid assignment id" });

    const deleted = await ManualAssignment.findOneAndDelete({ _id: id, educatorId }).lean();
    if (!deleted) return res.status(404).json({ ok: false, message: "Assignment not found" });

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteAssignment error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
