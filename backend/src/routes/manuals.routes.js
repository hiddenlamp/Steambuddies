// src/routes/manuals.routes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Manual = require("../models/Manual.js");

const router = express.Router();

/** ===================== AUTH MIDDLEWARE PICKER ===================== */
/**
 * Your project me auth middleware ka export name different ho sakta hai.
 * Isliye yaha safely pick kar rahe hain.
 */
let protect = null;
try {
  const auth = require("../middleware/auth.middleware.js");

  protect =
    (typeof auth.protect === "function" && auth.protect) ||
    (typeof auth.protectRoute === "function" && auth.protectRoute) ||
    (typeof auth.requireAuth === "function" && auth.requireAuth) ||
    (typeof auth.verifyToken === "function" && auth.verifyToken) ||
    (typeof auth.auth === "function" && auth.auth) ||
    (typeof auth.default === "function" && auth.default) ||
    null;
} catch {
  protect = null;
}

if (typeof protect !== "function") {
  // ⚠️ Dev fallback so server doesn't crash.
  // PRODUCTION me isko allow mat rakhna.
  console.warn("⚠️ manuals.routes.js: auth middleware (protect) not found. Using NO-AUTH fallback.");
  protect = (req, res, next) => next();
}

/** ===================== ROLE CHECK ===================== */
const isEducator = (user) => user && (user.role === "educator" || user.role === "admin");

/** ===================== ENSURE UPLOAD DIR ===================== */
const uploadDir = path.join(process.cwd(), "uploads", "manuals");
fs.mkdirSync(uploadDir, { recursive: true });

/** ===================== MULTER SETUP ===================== */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF allowed"));
    cb(null, true);
  },
});

/** ===================== ROUTES ===================== */

/**
 * ✅ Student Public List (ONLY published)
 * GET /manuals/public
 */
router.get("/public", async (req, res) => {
  try {
    const list = await Manual.find({ isPublished: true }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: "Failed to fetch manuals" });
  }
});

/**
 * ✅ Educator List (published + draft)
 * GET /manuals
 */
router.get("/", protect, async (req, res) => {
  try {
    if (!isEducator(req.user)) return res.status(403).json({ message: "Not allowed" });

    const list = await Manual.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: "Failed to fetch manuals" });
  }
});

/**
 * ✅ Upload Manual (Educator)
 * POST /manuals  (multipart/form-data)
 * file: pdf
 */
router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    if (!isEducator(req.user)) return res.status(403).json({ message: "Not allowed" });
    if (!req.file) return res.status(400).json({ message: "PDF file required" });

    const {
      titleEn,
      titleHi,
      descriptionEn,
      descriptionHi,
      category,
      grade,
      tags,
      isPublished,
    } = req.body;

    if (!titleEn || !String(titleEn).trim()) {
      return res.status(400).json({ message: "titleEn is required" });
    }

    let tagArr = [];
    try {
      tagArr = tags ? JSON.parse(tags) : [];
      if (!Array.isArray(tagArr)) tagArr = [];
    } catch {
      tagArr = [];
    }

    const fileUrl = `/uploads/manuals/${req.file.filename}`;

    const doc = await Manual.create({
      title: { en: String(titleEn).trim(), hi: String(titleHi || "").trim() },
      description: { en: String(descriptionEn || "").trim(), hi: String(descriptionHi || "").trim() },
      category: String(category || "").trim(),
      grade: String(grade || "").trim(),
      tags: tagArr.map((x) => String(x).trim()).filter(Boolean),
      fileUrl,
      fileName: req.file.originalname,
      isPublished: String(isPublished) === "true",
      createdBy: req.user._id,
    });

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: e?.message || "Upload failed" });
  }
});

/**
 * ✅ Publish / Unpublish
 * PATCH /manuals/:id/publish
 */
router.patch("/:id/publish", protect, async (req, res) => {
  try {
    if (!isEducator(req.user)) return res.status(403).json({ message: "Not allowed" });

    const doc = await Manual.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!doc) return res.status(404).json({ message: "Manual not found" });

    doc.isPublished = !!req.body.isPublished;
    await doc.save();

    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: "Publish update failed" });
  }
});

/**
 * ✅ Delete Manual
 * DELETE /manuals/:id
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!isEducator(req.user)) return res.status(403).json({ message: "Not allowed" });

    const doc = await Manual.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!doc) return res.status(404).json({ message: "Manual not found" });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
