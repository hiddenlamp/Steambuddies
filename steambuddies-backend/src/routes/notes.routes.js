// src/routes/notes.routes.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../utils/notesUpload");

const {
  createNote,
  listMyNotes,
  listForStudents,
  downloadNote,
  deleteNote,
} = require("../controllers/notes.controller");

// Educator
router.post(
  "/educator",
  requireAuth,
  requireRole("educator", "admin"),
  uploadPdf.single("file"),
  createNote
);

router.get(
  "/educator",
  requireAuth,
  requireRole("educator", "admin"),
  listMyNotes
);

router.delete(
  "/educator/:id",
  requireAuth,
  requireRole("educator", "admin"),
  deleteNote
);

// Student
router.get("/student", listForStudents);

// Download (stream)
router.get("/download/:id", downloadNote);

module.exports = router;
