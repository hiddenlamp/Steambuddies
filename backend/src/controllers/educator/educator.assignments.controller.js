// src/controllers/educator.assignments.controller.js
const mongoose = require("mongoose");
const Course = require("../../models/course.model");
const CourseAssignment = require("../../models/courseAssignment.model");

// ---------------- helpers ----------------
const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

function toObjectId(v) {
  const s = String(v || "").trim();
  if (!s || !isValidObjectId(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function getUserId(req) {
  const raw = req.userId || (req.user && (req.user._id || req.user.id)) || null;
  return toObjectId(raw) || null;
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ✅ keep educator and student consistent
function normalizeClassLevel(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
}

/**
 * ✅ Status normalization with aliases:
 * UI might send: running/paused/pending/completed
 * DB expects: active/inactive/paused/completed
 */
function normalizeStatus(status) {
  const s = String(status || "").trim().toLowerCase();

  if (s === "running") return "active";
  if (s === "pending") return "inactive";
  if (s === "stop" || s === "stopped") return "inactive";

  const allowed = new Set(["active", "inactive", "paused", "completed"]);
  return allowed.has(s) ? s : null;
}

function normalizeVisibility(v) {
  const s = String(v || "").trim().toLowerCase();
  const allowed = new Set(["visible", "hidden"]);
  return allowed.has(s) ? s : null;
}

// ✅ Course model me totalLessons field nahi hai — curriculum se compute karo
function computeTotalLessonsFromCourse(course) {
  if (!course) return 0;

  // 1) curriculum lessons
  const cur = Array.isArray(course.curriculum) ? course.curriculum : [];
  let total = 0;

  for (const sec of cur) {
    const lessons = Array.isArray(sec?.lessons) ? sec.lessons : [];
    total += lessons.length;
  }

  // 2) fallback: videos count
  if (!total && Array.isArray(course.videos)) total = course.videos.length;

  // 3) fallback: meta lectures
  const metaLectures = Number(course?.meta?.lectures);
  if (!total && Number.isFinite(metaLectures)) total = metaLectures;

  return Math.max(0, total);
}

function clampPct(v) {
  return Math.max(0, Math.min(100, num(v, 0)));
}

function computeProgressPct(completedLessons, totalLessons) {
  const t = Math.max(0, num(totalLessons, 0));
  const c = Math.max(0, num(completedLessons, 0));
  if (!t) return 0;
  const pct = (c / t) * 100;
  return clampPct(pct);
}

// ---------------- controllers ----------------

/**
 * GET /api/educator/assignments?schoolId=...&classLevel=...
 * Returns: { ok: true, items: [...] }
 */
exports.listAssignments = async (req, res) => {
  try {
    const schoolId = toObjectId(req.query.schoolId);
    const classLevel = normalizeClassLevel(req.query.classLevel);

    if (!schoolId) {
      return res.status(400).json({ ok: false, message: "Valid schoolId required" });
    }
    if (!classLevel) {
      return res.status(400).json({ ok: false, message: "classLevel required" });
    }

    const docs = await CourseAssignment.find({ schoolId, classLevel })
      .populate({
        path: "courseId",
        // ✅ Course model fields (sub/totalLessons are NOT in your Course schema)
        select: "_id status title category gradeGroup level description emoji curriculum videos meta",
      })
      .sort({ lastUpdated: -1, updatedAt: -1 })
      .lean();

    const items = (docs || []).map((a) => {
      const course = a.courseId || {};

      // ✅ always ensure totalLessons is correct
      const computedTotal = computeTotalLessonsFromCourse(course);
      const totalLessons = num(a.totalLessons, 0) > 0 ? num(a.totalLessons, 0) : computedTotal;

      const completedLessons = num(a.completedLessons, 0);

      // ✅ progress
      const progressPct =
        a.progressPct != null
          ? clampPct(a.progressPct)
          : computeProgressPct(completedLessons, totalLessons);

      // ✅ status auto
      let st = a.status || "active";
      if (progressPct >= 100) st = "completed";

      return {
        _id: a._id,
        schoolId: a.schoolId,
        classLevel: a.classLevel,

        status: st,
        visibility: a.visibility || "visible",

        progressPct,
        totalLessons,
        completedLessons,

        totalDurationMin: num(a.totalDurationMin, 0),
        completedDurationMin: num(a.completedDurationMin, 0),

        expectedWeeks: num(a.expectedWeeks, 0),
        startDate: a.startDate || null,
        lastUpdated: a.lastUpdated || null,
        updatedAt: a.updatedAt || null,

        course: {
          _id: course._id || null,
          status: course.status || null,
          title: course.title || { en: "", hi: "" },
          category: course.category || "",
          gradeGroup: course.gradeGroup || "",
          level: course.level || "",
          description: course.description || { en: "", hi: "" },
          emoji: course.emoji || "📚",

          // ✅ give UI true total lessons too
          totalLessons: computedTotal,
        },
      };
    });

    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listAssignments error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * POST /api/educator/assignments
 * Body: { courseId, schoolId, classLevel, expectedWeeks, status?, visibility? }
 * Returns: { ok: true, item }
 */
exports.assignCourseToSchoolClass = async (req, res) => {
  try {
    const courseId = toObjectId(req.body?.courseId);
    const schoolId = toObjectId(req.body?.schoolId);
    const classLevel = normalizeClassLevel(req.body?.classLevel);
    const expectedWeeks = Math.max(1, num(req.body?.expectedWeeks, 8));

    if (!courseId) return res.status(400).json({ ok: false, message: "Valid courseId required" });
    if (!schoolId) return res.status(400).json({ ok: false, message: "Valid schoolId required" });
    if (!classLevel) return res.status(400).json({ ok: false, message: "classLevel required" });

    // ✅ fetch course to compute total lessons (Course.exists not enough)
    const course = await Course.findById(courseId)
      .select("curriculum videos meta")
      .lean();

    if (!course) return res.status(404).json({ ok: false, message: "Course not found" });

    const totalLessonsComputed = computeTotalLessonsFromCourse(course);

    const userId = getUserId(req);

    const incomingStatus = req.body?.status != null ? normalizeStatus(req.body.status) : null;
    const incomingVisibility = req.body?.visibility != null ? normalizeVisibility(req.body.visibility) : null;

    const doc = await CourseAssignment.findOneAndUpdate(
      { courseId, schoolId, classLevel },
      {
        $setOnInsert: {
          status: incomingStatus || "active",
          visibility: incomingVisibility || "visible",

          progressPct: 0,
          startDate: new Date(),

          // ✅ IMPORTANT FIX
          totalLessons: totalLessonsComputed,
          completedLessons: 0,
          totalDurationMin: 0,
          completedDurationMin: 0,

          expectedWeeks,
          lastUpdated: new Date(),

          assignedBy: userId || undefined,
          updatedBy: userId || undefined,
        },
        $set: {
          // ✅ if already exists, still keep fresh values
          expectedWeeks,
          lastUpdated: new Date(),
          updatedBy: userId || undefined,

          // ✅ if older assignment had 0, fix it
          ...(totalLessonsComputed > 0 ? { totalLessons: totalLessonsComputed } : {}),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, item: doc });
  } catch (e) {
    console.error("assignCourseToSchoolClass error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * PATCH /api/educator/assignments/:assignmentId
 * Accepts: status, visibility, progressPct, expectedWeeks, totalLessons, completedLessons etc.
 */
exports.updateAssignment = async (req, res) => {
  try {
    const assignmentId = toObjectId(req.params.assignmentId);
    if (!assignmentId) {
      return res.status(400).json({ ok: false, message: "Invalid assignmentId" });
    }

    const userId = getUserId(req);

    const patch = {
      lastUpdated: new Date(),
      updatedBy: userId || undefined,
    };

    // status
    if (req.body?.status != null) {
      const s = normalizeStatus(req.body.status);
      if (!s) {
        return res.status(400).json({
          ok: false,
          message:
            "Invalid status (allowed: active, inactive, paused, completed + aliases: running, pending)",
        });
      }
      patch.status = s;
    }

    // visibility
    if (req.body?.visibility != null) {
      const v = normalizeVisibility(req.body.visibility);
      if (!v) {
        return res.status(400).json({
          ok: false,
          message: "Invalid visibility (allowed: visible, hidden)",
        });
      }
      patch.visibility = v;
    }

    // expected weeks
    if (req.body?.expectedWeeks != null) {
      patch.expectedWeeks = Math.max(1, num(req.body.expectedWeeks, 1));
    }

    // lessons/duration
    let totalLessons = null;
    let completedLessons = null;

    if (req.body?.totalLessons != null) {
      totalLessons = Math.max(0, num(req.body.totalLessons, 0));
      patch.totalLessons = totalLessons;
    }

    if (req.body?.completedLessons != null) {
      completedLessons = Math.max(0, num(req.body.completedLessons, 0));
      patch.completedLessons = completedLessons;
    }

    if (req.body?.totalDurationMin != null) patch.totalDurationMin = Math.max(0, num(req.body.totalDurationMin, 0));
    if (req.body?.completedDurationMin != null) patch.completedDurationMin = Math.max(0, num(req.body.completedDurationMin, 0));

    // progressPct
    if (req.body?.progressPct != null) {
      patch.progressPct = clampPct(req.body.progressPct);
    }

    // ✅ If lessons updated but progress not provided, auto-calc progress
    if (patch.progressPct == null && (totalLessons != null || completedLessons != null)) {
      // we need current doc to compute accurately
      const current = await CourseAssignment.findById(assignmentId).select("totalLessons completedLessons").lean();
      const t = totalLessons != null ? totalLessons : num(current?.totalLessons, 0);
      const c = completedLessons != null ? completedLessons : num(current?.completedLessons, 0);
      patch.progressPct = computeProgressPct(c, t);
    }

    // ✅ consistency rules
    if (patch.progressPct != null && patch.progressPct >= 100) {
      patch.status = "completed";
      patch.progressPct = 100;
    }
    if (patch.status === "completed") {
      patch.progressPct = 100;
    }

    const updated = await CourseAssignment.findByIdAndUpdate(
      assignmentId,
      { $set: patch },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Assignment not found" });
    }

    return res.json({ ok: true, item: updated });
  } catch (e) {
    console.error("updateAssignment error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * DELETE /api/educator/assignments/:assignmentId
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentId = toObjectId(req.params.assignmentId);
    if (!assignmentId) {
      return res.status(400).json({ ok: false, message: "Invalid assignmentId" });
    }

    const deleted = await CourseAssignment.findByIdAndDelete(assignmentId);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Assignment not found" });
    }

    return res.json({ ok: true, message: "Assignment deleted" });
  } catch (e) {
    console.error("deleteAssignment error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
