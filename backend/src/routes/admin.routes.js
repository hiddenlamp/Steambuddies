// src/routes/admin.routes.js
const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

// All routes here require authentication and "admin" role
router.use(requireAuth, requireRole("admin"));

// Dashboard Metrics
router.get("/metrics", adminController.getMetrics);

// User Management
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
