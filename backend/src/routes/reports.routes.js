const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const DailyReport = require("../models/DailyReport");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Multer setup for reports
const dir = path.join(__dirname, "../../uploads/reports");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

// Create a report (Educator)
router.post("/", requireAuth, requireRole("educator"), upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, message: "Please upload at least 1 image." });
    }
    
    // Construct public URLs for images
    const imageUrls = req.files.map(f => `/uploads/reports/${f.filename}`);

    const report = new DailyReport({
      educator: req.user.id,
      schoolName: req.body.schoolName,
      visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date(),
      studentCount: parseInt(req.body.studentCount || 0),
      classesTaught: req.body.classesTaught,
      topicsTaught: req.body.topicsTaught,
      projectBuilt: req.body.projectBuilt,
      images: imageUrls,
    });

    await report.save();
    return res.status(201).json({ ok: true, report });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// Get all reports (Admin)
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const reports = await DailyReport.find()
      .populate("educator", "fullName email") // get educator details
      .sort({ visitDate: -1 });
    return res.json({ ok: true, reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({ ok: false, message: "Failed to fetch reports" });
  }
});

module.exports = router;
