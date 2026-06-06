// src/controllers/student.courses.controller.js
const mongoose = require("mongoose");
const CourseAssignment = require("../../models/courseAssignment.model");
const School = require("../../models/SchoolModel");

const toStr = (v) => (v === undefined || v === null ? "" : String(v)).trim();

function normalizeClassLevel(v) {
  const s = toStr(v);
  if (!s) return "";
  const m = s.match(/\d+/);
  return m ? String(parseInt(m[0], 10)) : s;
}

function setNoCache(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
}

// ✅ Localized helpers (Course.title / description / badge are objects)
function pickLocalized(v, lang = "en") {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    return (
      toStr(v?.[lang]) ||
      toStr(v?.en) ||
      toStr(v?.hi) ||
      ""
    );
  }
  return toStr(v);
}

function computeTotalLessons(course) {
  // 1) curriculum lessons count
  const cur = Array.isArray(course?.curriculum) ? course.curriculum : [];
  let total = 0;
  for (const sec of cur) {
    const lessons = Array.isArray(sec?.lessons) ? sec.lessons : [];
    total += lessons.length;
  }
  // 2) fallback videos
  if (!total && Array.isArray(course?.videos)) total = course.videos.length;
  // 3) fallback meta lectures
  if (!total && Number.isFinite(Number(course?.meta?.lectures))) total = Number(course.meta.lectures);
  return Math.max(0, total);
}

async function resolveSchoolIdFromUser(user) {
  if (user?.schoolId && mongoose.Types.ObjectId.isValid(user.schoolId)) {
    return new mongoose.Types.ObjectId(user.schoolId);
  }

  const maybe = toStr(user?.schoolName) || toStr(user?.school) || toStr(user?.schoolId);
  if (!maybe) return null;

  if (mongoose.Types.ObjectId.isValid(maybe)) return new mongoose.Types.ObjectId(maybe);

  // flexible case-insensitive lookup
  const escaped = maybe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let schoolDoc = await School.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" },
  }).select("_id name").lean();

  if (!schoolDoc) {
    schoolDoc = await School.findOne({
      name: { $regex: escaped, $options: "i" },
    }).select("_id name").lean();
  }

  return schoolDoc?._id || null;
}

/**
 * GET /api/student/my-active-courses
 */
exports.getMyActiveCourses = async (req, res) => {
  setNoCache(res);

  try {
    const user = req.user;
    if (!user) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const schoolId = await resolveSchoolIdFromUser(user);
    const classLevel = normalizeClassLevel(user.classLevel || user.className);

    if (!schoolId || !classLevel) {
      return res.status(200).json({ ok: true, items: [] });
    }

    const query = {
      schoolId,
      classLevel,
      status: { $in: ["active", "paused"] },
      $or: [{ visibility: "visible" }, { visibility: { $exists: false } }],
    };

    const assignments = await CourseAssignment.find(query)
      .populate({
        path: "courseId",
        // ✅ bring curriculum/videos/meta for totalLessons calculation
        select: "title description badge category level emoji curriculum videos meta duration status",
      })
      .sort({ lastUpdated: -1, updatedAt: -1 })
      .lean();

    const lang = toStr(req.query.lang) || "en";

    const items = (assignments || [])
      .filter((a) => a.courseId)
      .map((a) => {
        const course = a.courseId || {};

        // ✅ compute lessons from course if assignment has 0
        const courseTotalLessons = computeTotalLessons(course);

        const completedLessons = Number(a.completedLessons || 0);

        const totalLessonsRaw = Number(a.totalLessons || 0);
        const totalLessons = totalLessonsRaw > 0 ? totalLessonsRaw : courseTotalLessons;

        // ✅ computed progress fallback if progressPct missing
        const computedPct =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        const progressPct = Math.max(
          0,
          Math.min(100, Number(a.progressPct ?? computedPct ?? 0))
        );

        // ✅ title/sub localized
        const titleText = pickLocalized(course.title, lang) || "Untitled Course";
        const subText =
          pickLocalized(course.badge, lang) ||
          pickLocalized(course.description, lang) ||
          "";

        return {
          id: String(a._id),
          assignmentId: String(a._id),
          courseId: course?._id ? String(course._id) : "",

          // ✅ send raw localized too (UI can handle object)
          title: course.title || titleText,
          sub: subText,

          categoryLabel: course.category || "Course",
          categoryEmoji: "✨",
          emoji: course.emoji || "📚",

          status: a.status || "active",

          progressPct,
          completedLessons,
          totalLessons,

          lastUpdated: a.lastUpdated || a.updatedAt || null,

          startDate: a.startDate ? new Date(a.startDate).toISOString() : null,
          expectedWeeks: Number(a.expectedWeeks || 0),
        };
      })
      .filter((x) => x.courseId);

    return res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("getMyActiveCourses error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
