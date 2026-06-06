const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const { getMyActiveCourses } = require("../../controllers/student/student.courses.controller");

const router = Router();

router.get("/my-active-courses", requireAuth, getMyActiveCourses);

module.exports = router;
