// src/routes/reels.routes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const reelsController = require("../controllers/reels.controller");
const { requireAuth } = require("../middleware/auth.middleware");

// Multer setup for local uploads
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "reels");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    cb(null, `${Date.now()}-${uid}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype?.startsWith("image/") || file.mimetype?.startsWith("video/");
    if (!ok) return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
    cb(null, true);
  },
});

function uploadSingleSafe(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, message: "File too large (max 50MB)" });
        return res.status(400).json({ ok: false, message: "Invalid file. Only image/video allowed." });
      }
      return res.status(400).json({ ok: false, message: err.message || "Upload failed" });
    });
  };
}

// Routes
router.post("/", requireAuth, uploadSingleSafe("file"), reelsController.createReel);
router.get("/my-reels", requireAuth, reelsController.getMyReels);
router.get("/", requireAuth, reelsController.getAllReels);
router.post("/:id/like", requireAuth, reelsController.likeReel);
router.post("/:id/seen", requireAuth, reelsController.seenReel);
router.delete("/:id", requireAuth, reelsController.deleteReel);

// Educator Moderation Routes
router.get("/pending/all", requireAuth, reelsController.getPendingReels);
router.put("/:id/approve", requireAuth, reelsController.approveReel);
router.put("/:id/reject", requireAuth, reelsController.rejectReel);

module.exports = router;
