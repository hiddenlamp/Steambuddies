// src/routes/syllabus.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../utils/notesUpload");

const {
  createSyllabus,
  listMySyllabuses,
  listForStudents,
  downloadSyllabus,
  deleteSyllabus,
} = require("../controllers/syllabus.controller");

// Educator
router.post(
  "/educator",
  requireAuth,
  requireRole("educator", "admin"),
  uploadPdf.single("file"),
  createSyllabus
);

router.get(
  "/educator",
  requireAuth,
  requireRole("educator", "admin"),
  listMySyllabuses
);

router.delete(
  "/educator/:id",
  requireAuth,
  requireRole("educator", "admin"),
  deleteSyllabus
);

// Student
router.get("/student", listForStudents);

// Download (stream)
router.get("/download/:id", downloadSyllabus);

module.exports = router;
