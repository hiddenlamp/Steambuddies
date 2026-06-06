const router = require("express").Router();

const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac");

const {
  createProject,
  getStudentProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projects.controller");

/**
 * STUDENT: assigned projects
 * Primary route:
 * GET /api/projects/student
 */
router.get(
  "/student",
  requireAuth,
  requireRole("student"),
  getStudentProjects
);

/**
 * EDUCATOR / ADMIN: create project
 * POST /api/projects
 */
router.post(
  "/",
  requireAuth,
  requireRole("educator", "admin"),
  createProject
);

/**
 * EDUCATOR / ADMIN: own uploaded projects
 * GET /api/projects/mine
 */
router.get(
  "/mine",
  requireAuth,
  requireRole("educator", "admin"),
  getMyProjects
);

/**
 * AUTH USER: single project by id
 * GET /api/projects/:id
 */
router.get(
  "/:id",
  requireAuth,
  getProjectById
);

/**
 * EDUCATOR / ADMIN: update project
 * PUT /api/projects/:id
 */
router.put(
  "/:id",
  requireAuth,
  requireRole("educator", "admin"),
  updateProject
);

/**
 * EDUCATOR / ADMIN: delete project
 * DELETE /api/projects/:id
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("educator", "admin"),
  deleteProject
);

module.exports = router;