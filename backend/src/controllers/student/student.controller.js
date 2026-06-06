import CourseAssignment from "../models/courseAssignment.model.js";
import Course from "../models/Course.js";
import StudentProgress from "../models/StudentProgress.js";
import { computeETA } from "../utils/eta.js";

export async function getMyActiveSchoolCourses(req, res) {
  try {
    const user = req.user || {};
    const language = req.query.language === "hi" ? "hi" : "en";

    // ✅ User fields (as per your DB screenshot: school + className)
    const schoolValue =
      user.schoolId || user.school || user.school_id || null; // can be ObjectId OR string
    const classValueRaw =
      user.classId || user.className || user.class || user.classLevel || null;

    const classValue = classValueRaw != null ? String(classValueRaw).trim() : "";

    if (!schoolValue || !classValue) {
      return res.json({ ok: true, courses: [] });
    }

    // ✅ Detect which field names exist in CourseAssignment collection
    // We'll find 1 sample doc for this school/class using both patterns (safe)
    const tryQuery1 = {
      schoolId: schoolValue,
      classId: classValue,
      status: "active",
    };

    const tryQuery2 = {
      schoolName: String(schoolValue),
      className: classValue,
      status: "active",
    };

    // Try with schoolId/classId first
    let assignments = await CourseAssignment.find(tryQuery1)
      .sort({ updatedAt: -1 })
      .lean();

    // If not found, try with schoolName/className
    if (!assignments.length) {
      assignments = await CourseAssignment.find(tryQuery2)
        .sort({ updatedAt: -1 })
        .lean();
    }

    if (!assignments.length) {
      return res.json({ ok: true, courses: [] });
    }

    // ✅ Fetch courses
    const courseIds = assignments.map((a) => a.courseId).filter(Boolean);
    const courses = await Course.find({
      _id: { $in: courseIds },
      isArchived: false,
    }).lean();

    const courseMap = new Map(courses.map((c) => [String(c._id), c]));

    // ✅ Progress rows
    const assignmentIds = assignments.map((a) => a._id);
    const progressRows = await StudentProgress.find({
      userId: user._id,
      assignmentId: { $in: assignmentIds },
    }).lean();

    const progressMap = new Map(
      progressRows.map((p) => [String(p.assignmentId), p])
    );

    const payload = assignments
      .map((a) => {
        const course = courseMap.get(String(a.courseId));
        if (!course) return null;

        const p = progressMap.get(String(a._id));
        const completedLessons = Number(p?.completedLessons ?? 0);
        const totalLessons = Math.max(1, Number(course.totalLessons ?? 1));
        const progressPct = Math.round((completedLessons / totalLessons) * 100);

        const eta = computeETA({
          startDate: a.startDate,
          expectedWeeks: a.expectedWeeks,
          completedLessons,
          totalLessons,
          language,
        });

        return {
          id: String(a._id), // assignment id
          courseId: String(course._id),

          emoji: course.emoji || "📚",
          categoryEmoji: course.categoryEmoji || "✨",
          categoryLabel: course.categoryLabel,
          status: { en: "Running", hi: "चल रहा" },

          title: course.title,
          sub: course.sub,

          progress: Math.max(0, Math.min(100, progressPct)),
          completedLessons,
          totalLessons,
          projects: Number(course.projects ?? 0),

          lastUpdated: a.updatedAt
            ? new Date(a.updatedAt).toLocaleDateString("en-IN")
            : null,

          eta,
          activeStudents: a.activeStudents ?? null, // if exists
        };
      })
      .filter(Boolean);

    return res.json({ ok: true, courses: payload });
  } catch (err) {
    console.error("getMyActiveSchoolCourses error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateMyProgress(req, res) {
  try {
    const user = req.user || {};
    const { assignmentId, completedLessons } = req.body;

    if (!assignmentId) {
      return res
        .status(400)
        .json({ ok: false, message: "assignmentId is required" });
    }

    const row = await StudentProgress.findOneAndUpdate(
      { userId: user._id, assignmentId },
      {
        $set: {
          completedLessons: Number(completedLessons || 0),
          lastAccessedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ ok: true, progress: row });
  } catch (err) {
    console.error("updateMyProgress error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
