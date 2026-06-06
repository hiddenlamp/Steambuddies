// src/controllers/educator.schoolCourses.controller.js
const mongoose = require("mongoose");
const Course = require("../../models/course.model");
const CourseAssignment = require("../../models/courseAssignment.model");

/* =========================
   Helpers
========================= */
const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function getUserId(req) {
  return req.userId || req.user?._id || null;
}

// Your Course model doesn't have totalLessons/totalDurationMin fields,
// so we compute them from curriculum/videos/meta.
function computeTotalLessons(course) {
  const cur = Array.isArray(course?.curriculum) ? course.curriculum : [];
  let total = 0;

  for (const sec of cur) {
    const lessons = Array.isArray(sec?.lessons) ? sec.lessons : [];
    total += lessons.length;
  }

  // fallback: videos length
  if (!total && Array.isArray(course?.videos)) total = course.videos.length;

  // fallback: meta.lectures
  const metaLect = Number(course?.meta?.lectures);
  if (!total && Number.isFinite(metaLect)) total = metaLect;

  return Math.max(0, Number(total) || 0);
}

// Use badge > description as "sub" for UI
function pickSub(course) {
  return course?.badge || course?.description || { en: "", hi: "" };
}

/**
 * ✅ GET /api/educator/assignments?schoolId=...&classLevel=...
 * Returns: { items: [assignmentUIObject] }
 */
exports.listAssignments = async (req, res) => {
  try {
    const schoolId = String(req.query.schoolId || "").trim();
    const classLevel = String(req.query.classLevel || "").trim();

    if (!schoolId) return res.status(400).json({ message: "schoolId required" });
    if (!classLevel) return res.status(400).json({ message: "classLevel required" });
    if (!isValidObjectId(schoolId)) return res.status(400).json({ message: "Invalid schoolId" });

    const items = await CourseAssignment.find({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      classLevel: String(classLevel),
    })
      .populate({
        path: "courseId",
        // ✅ only fields that exist in your Course model
        select: "title badge description category status level curriculum videos meta duration emoji",
      })
      .sort({ lastUpdated: -1, updatedAt: -1 })
      .lean();

    const out = (items || [])
      .filter((a) => a?.courseId)
      .map((a) => {
        const c = a.courseId;

        const courseTotalLessons = computeTotalLessons(c);

        const totalLessons = toInt(a.totalLessons, 0) || courseTotalLessons;
        const completedLessons = toInt(a.completedLessons, 0);

        // If your assignment schema has duration fields use them; else estimate 12 min/lesson
        const totalDurationMin =
          toInt(a.totalDurationMin, 0) || (totalLessons ? totalLessons * 12 : 0);
        const completedDurationMin =
          toInt(a.completedDurationMin, 0) || (completedLessons ? completedLessons * 12 : 0);

        const progressPct =
          totalLessons > 0 ? clamp(Math.round((completedLessons / totalLessons) * 100), 0, 100) : 0;

        return {
          _id: a._id, // ✅ assignment id (SchoolCourses.jsx expects this)
          schoolId: a.schoolId,
          classLevel: a.classLevel,

          // assignment-based toggles
          status: a.status || "active", // active | inactive | paused
          visibility: a.visibility || "visible", // visible | hidden

          expectedWeeks: Math.max(1, toInt(a.expectedWeeks, 8)),
          startDate: a.startDate || null,
          lastUpdated: a.lastUpdated || a.updatedAt || null,

          progress: {
            totalLessons,
            completedLessons,
            totalDurationMin,
            completedDurationMin,
            progressPct,
          },

          course: {
            _id: c._id,
            title: c.title,
            sub: pickSub(c),
            category: c.category || "Course",
            courseStatus: c.status || "draft",
            level: c.level || "Beginner",
            emoji: c.emoji || "📚",
          },
        };
      });

    return res.json({ items: out });
  } catch (e) {
    console.error("listAssignments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ POST /api/educator/assignments
 * Body: { courseId, schoolId, classLevel, expectedWeeks }
 */
exports.assignCourseToSchoolClass = async (req, res) => {
  try {
    const { courseId, schoolId, classLevel, expectedWeeks } = req.body || {};

    if (!courseId) return res.status(400).json({ message: "courseId required" });
    if (!schoolId) return res.status(400).json({ message: "schoolId required" });
    if (!classLevel) return res.status(400).json({ message: "classLevel required" });

    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid courseId" });
    if (!isValidObjectId(schoolId)) return res.status(400).json({ message: "Invalid schoolId" });

    const course = await Course.findById(courseId)
      .select("_id curriculum videos meta status")
      .lean();

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Optional: only allow assigning published courses
    // if (course.status !== "published") return res.status(400).json({ message: "Only published courses can be assigned" });

    const totalLessons = computeTotalLessons(course);
    const estimatedTotalDurationMin = totalLessons ? totalLessons * 12 : 0;

    const doc = await CourseAssignment.findOneAndUpdate(
      {
        courseId: new mongoose.Types.ObjectId(courseId),
        schoolId: new mongoose.Types.ObjectId(schoolId),
        classLevel: String(classLevel),
      },
      {
        $setOnInsert: {
          status: "active",
          visibility: "visible",
          startDate: new Date(),
          completedLessons: 0,
          completedDurationMin: 0,
          totalLessons: totalLessons,
          totalDurationMin: estimatedTotalDurationMin,
        },
        $set: {
          expectedWeeks: Math.max(1, toInt(expectedWeeks, 8)),
          lastUpdated: new Date(),
          updatedBy: getUserId(req),
        },
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ ok: true, item: doc });
  } catch (e) {
    console.error("assignCourseToSchoolClass error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ PATCH /api/educator/assignments/:assignmentId
 * Body can include:
 * { status, visibility, completedLessons, completedDurationMin, expectedWeeks }
 */
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!isValidObjectId(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignmentId" });
    }

    const { status, visibility, completedLessons, completedDurationMin, expectedWeeks } = req.body || {};

    const patch = { lastUpdated: new Date(), updatedBy: getUserId(req) };

    if (status != null) {
      const s = String(status);
      if (!["active", "inactive", "paused"].includes(s)) {
        return res.status(400).json({ message: "status must be active|inactive|paused" });
      }
      patch.status = s;
    }

    if (visibility != null) {
      const v = String(visibility);
      if (!["visible", "hidden"].includes(v)) {
        return res.status(400).json({ message: "visibility must be visible|hidden" });
      }
      patch.visibility = v;
    }

    if (expectedWeeks != null) patch.expectedWeeks = Math.max(1, toInt(expectedWeeks, 8));
    if (completedLessons != null) patch.completedLessons = Math.max(0, toInt(completedLessons, 0));
    if (completedDurationMin != null) patch.completedDurationMin = Math.max(0, toInt(completedDurationMin, 0));

    const updated = await CourseAssignment.findByIdAndUpdate(assignmentId, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: "Assignment not found" });

    return res.json({ ok: true, item: updated });
  } catch (e) {
    console.error("updateAssignment error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
