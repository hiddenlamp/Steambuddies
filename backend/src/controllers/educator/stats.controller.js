const Course = require("../../models/course.model.js");
const CourseAssignment = require("../../models/courseAssignment.model.js");
const Activity = require("../../models/Activity.js");
const MockTest = require("../../models/MockTest.js");
const Project = require("../../models/Project.js");
const Manual = require("../../models/Manual.js");
const Note = require("../../models/Note.model.js");
const Challenge = require("../../models/Challenge.js");
const Reel = require("../../models/Reel.js");

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch counts in parallel
    const [
      coursesCount,
      schoolCoursesCount,
      activitiesCount,
      mocktestsCount,
      projectsCount,
      manualsCount,
      syllabusCount,
      notesCount,
      challengesCount,
      reelsCount
    ] = await Promise.all([
      Course.countDocuments({ educator: userId }), // Assuming educator is tracked, otherwise just Course.countDocuments()
      CourseAssignment.countDocuments(), 
      Activity.countDocuments(),
      MockTest.countDocuments({ createdBy: userId }),
      Project.countDocuments(),
      Manual.countDocuments(),
      Note.countDocuments({ category: "syllabus" }), // Assuming syllabus is a category
      Note.countDocuments({ category: { $ne: "syllabus" } }),
      Challenge.countDocuments(),
      Reel.countDocuments({ authorId: userId })
    ]);

    res.json({
      ok: true,
      counts: {
        courses: coursesCount,
        schoolCourses: schoolCoursesCount,
        activities: activitiesCount,
        mocktests: mocktestsCount,
        projects: projectsCount,
        manuals: manualsCount,
        syllabus: syllabusCount,
        notes: notesCount,
        challenges: challengesCount,
        reels: reelsCount
      }
    });
  } catch (error) {
    console.error("Educator stats error:", error);
    res.status(500).json({ ok: false, message: "Failed to fetch stats" });
  }
};
