// src/controllers/profile.controller.js
const mongoose = require("mongoose");

const User = require("../models/User");
const CourseAssignment = require("../models/courseAssignment.model"); // ✅ FIXED (exact filename)
const MockAttempt = require("../models/MockAttempt");
const Project = require("../models/Project");
const Note = require("../models/Note.model");
const ActivityView = require("../models/ActivityView");
const ActivityLike = require("../models/ActivityLike");

function toObjectId(id) {
  try {
    if (!id) return null;
    return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
  } catch {
    return null;
  }
}

exports.getMyProfile = async (req, res) => {
  try {
    // ✅ auth middleware usually sets: req.userId / req.userIdObj / req.user
    const userId =
      req.userId ||
      req.userIdObj ||
      req.user?._id ||
      req.user?.id;

    const uid = toObjectId(userId);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(uid).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ parallel stats queries
    const [
      coursesAssigned,
      coursesCompleted,
      mockAttempts,
      avgMockAgg,
      projects,
      notes,
      activityViews,
      activityLikes,
    ] = await Promise.all([
      CourseAssignment.countDocuments({ studentId: uid }),
      CourseAssignment.countDocuments({ studentId: uid, status: "completed" }),

      MockAttempt.countDocuments({ studentId: uid }),
      MockAttempt.aggregate([
        { $match: { studentId: uid } },
        { $group: { _id: null, avg: { $avg: "$score" } } },
      ]),

      Project.countDocuments({ studentId: uid }),
      // NOTE: if your Note schema uses "userId" keep it, else change to { studentId: uid }
      Note.countDocuments({ userId: uid }),

      ActivityView.countDocuments({ userId: uid }),
      ActivityLike.countDocuments({ userId: uid }),
    ]);

    // ✅ if score is stored 0-100 (most common), avgMockScore will be 0-100
    // if your score is 0-1 then multiply in aggregate or here. (abhi assume 0-100)
    const avgMockScore = Math.round((avgMockAgg?.[0]?.avg || 0) * 100) / 100;

    // ✅ recent lists
    const recentAssignments = await CourseAssignment.find({ studentId: uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("courseId", "title name")
      .lean();

    const recentMocks = await MockAttempt.find({ studentId: uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("mockTestId", "title name")
      .lean();

    const recentProjects = await Project.find({ studentId: uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      user: {
        fullName: user.fullName || user.name || "",
        role: user.role || "student",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        classLevel: user.classLevel || "",
        schoolName: user.school || user.schoolName || "",
        assignedSchools: user.assignedSchools || [],
        studentId: user.studentId || "",
        educatorId: user.educatorId || "",
        createdAt: user.createdAt,
      },
      stats: {
        coursesAssigned: Number(coursesAssigned || 0),
        coursesCompleted: Number(coursesCompleted || 0),
        mockAttempts: Number(mockAttempts || 0),
        avgMockScore: Number(avgMockScore || 0),
        projects: Number(projects || 0),
        notes: Number(notes || 0),
        activityViews: Number(activityViews || 0),
        activityLikes: Number(activityLikes || 0),
      },
      recent: {
        courses: (recentAssignments || []).map((x) => ({
          title: x.courseId?.title || x.courseId?.name || x.courseTitle || "Course",
          status: x.status || "assigned",
          assignedAt: x.assignedAt || x.createdAt || null,
        })),
        mocks: (recentMocks || []).map((x) => ({
          title: x.mockTestId?.title || x.mockTestId?.name || x.title || "Mock Test",
          score: Number(x.score || 0),
          createdAt: x.createdAt || null,
        })),
        projects: (recentProjects || []).map((x) => ({
          title: x.title || x.name || "Project",
          status: x.status || "—",
          createdAt: x.createdAt || null,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Profile summary error",
      error: err.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId || req.userIdObj || req.user?._id || req.user?.id;
    const uid = toObjectId(userId);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { assignedSchools } = req.body;
    
    // Allow updating assignedSchools if educator
    if (user.role === "educator" && Array.isArray(assignedSchools)) {
      user.assignedSchools = assignedSchools;
    }

    await user.save();
    return res.json({ message: "Profile updated successfully" });
  } catch(err) {
     return res.status(500).json({ message: "Update error", error: err.message });
  }
};
