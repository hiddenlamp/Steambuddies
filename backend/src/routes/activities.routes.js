// src/routes/activities.routes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { requireAuth } = require("../middleware/auth.middleware");
const Activity = require("../models/Activity");
const ActivityLike = require("../models/ActivityLike");
const ActivityView = require("../models/ActivityView");

const router = express.Router();

const roleOf = (u) => String(u?.role || "").toLowerCase();
const userIdOf = (u) => String(u?._id || u?.id || "guest");

function assertEducator(req) {
  const r = roleOf(req.user);
  return r === "educator" || r === "admin";
}

async function toClientActivity(a, userId) {
  const isGuest = userId === "guest";
  
  let liked = false;
  let seen = false;

  if (!isGuest) {
    const likeCount = await ActivityLike.countDocuments({ activity: a._id, user: userId });
    liked = likeCount > 0;
    const viewCount = await ActivityView.countDocuments({ activity: a._id, user: userId });
    seen = viewCount > 0;
  }

  return {
    id: a._id,
    type: a.type,
    src: a.mediaUrl || "",
    title: a.title || { en: "", hi: "" },
    caption: a.caption || { en: "", hi: "" },
    badge: a.badge || { en: "STEAM", hi: "STEAM" },
    durationSec: a.durationSec ?? 12,
    bgIndex: 0,
    educator: {
      id: a.educator?._id,
      name: a.educator?.fullName || a.educator?.name || "Educator",
      avatarLetter: ((a.educator?.fullName || a.educator?.name)?.[0] || "E").toUpperCase(),
      profilePic: a.educator?.profilePic
    },
    stats: {
      views: a.stats?.views ?? 0,
      likes: a.stats?.likes ?? 0,
    },
    my: {
      liked,
      seen,
    },
    createdAt: a.createdAt
  };
}

/**
 * Multer setup
 */
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "activities");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const uid = Math.random().toString(36).slice(2);
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

// ✅ Safe multer wrapper
function uploadSingleSafe(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ ok: false, message: "File too large (max 50MB)" });
        }
        return res.status(400).json({ ok: false, message: "Invalid file. Only image/video allowed." });
      }

      return res.status(400).json({ ok: false, message: err.message || "Upload failed" });
    });
  };
}

/**
 * ✅ GET /api/activities/feed
 * Public feed (optional login)
 */
router.get("/feed", async (req, res) => {
  try {
    const user = req.user || { id: "guest" };
    const me = userIdOf(user);
    
    // Fetch activities that haven't expired
    const activities = await Activity.find({
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }]
    })
    .populate("educator", "fullName name profilePic")
    .sort({ createdAt: -1 })
    .limit(50);

    const list = await Promise.all(activities.map(a => toClientActivity(a, me)));
    
    return res.json({ ok: true, activities: list });
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to fetch activities"});
  }
});

/**
 * ✅ GET /api/activities/my
 * Educator only
 */
router.get("/my", requireAuth, async (req, res) => {
  if (!assertEducator(req)) {
    return res.status(403).json({ ok: false, message: "Only educator can access" });
  }

  const me = userIdOf(req.user);

  try {
    const activities = await Activity.find({ educator: me })
      .populate("educator", "fullName name profilePic")
      .sort({ createdAt: -1 })
      .limit(100);

    const list = await Promise.all(activities.map(a => toClientActivity(a, me)));

    return res.json({ ok: true, activities: list });
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to fetch my activities"});
  }
});

/**
 * ✅ POST /api/activities
 * Educator only
 */
router.post("/", requireAuth, uploadSingleSafe("file"), async (req, res) => {
  if (!assertEducator(req)) {
    return res.status(403).json({ ok: false, message: "Only educator can post" });
  }

  const type = String(req.body.type || "").toLowerCase();
  const durationSec = Number(req.body.durationSec || 12);

  if (!["video", "image", "text"].includes(type)) {
    return res.status(400).json({ ok: false, message: "Invalid type" });
  }

  const title = { en: req.body.title_en || "", hi: req.body.title_hi || "" };
  const caption = { en: req.body.caption_en || "", hi: req.body.caption_hi || "" };
  const badge = { en: req.body.badge_en || "STEAM", hi: req.body.badge_hi || "STEAM" };

  let src = "";
  if (type === "video" || type === "image") {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "File is required for video/image" });
    }
    src = `/uploads/activities/${req.file.filename}`;
  }

  const educatorId = userIdOf(req.user);

  try {
    const newActivity = await Activity.create({
      educator: educatorId,
      type,
      mediaUrl: src,
      title,
      caption,
      badge,
      durationSec: Math.max(5, Math.min(durationSec, 60)),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await newActivity.populate("educator", "fullName name profilePic");

    return res.status(201).json({
      ok: true,
      message: "Activity created",
      activity: await toClientActivity(newActivity, educatorId),
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to create activity"});
  }
});

/**
 * ✅ DELETE /api/activities/:id
 */
router.delete("/:id", requireAuth, async (req, res) => {
  if (!assertEducator(req)) {
    return res.status(403).json({ ok: false, message: "Only educator can delete" });
  }

  const role = roleOf(req.user);
  const me = userIdOf(req.user);
  const id = req.params.id;

  try {
    const a = await Activity.findById(id);
    if (!a) return res.status(404).json({ ok: false, message: "Activity not found" });

    if (role !== "admin" && String(a.educator) !== me) {
      return res.status(403).json({ ok: false, message: "Not allowed" });
    }

    if (a.mediaUrl?.startsWith("/uploads/activities/")) {
      const filename = a.mediaUrl.split("/uploads/activities/")[1];
      const fp = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await Activity.findByIdAndDelete(id);
    return res.json({ ok: true, message: "Activity deleted" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to delete"});
  }
});

/**
 * ✅ POST /api/activities/:id/like
 */
router.post("/:id/like", requireAuth, async (req, res) => {
  const userId = userIdOf(req.user);
  const id = req.params.id;

  try {
    const a = await Activity.findById(id);
    if (!a) return res.status(404).json({ ok: false, message: "Activity not found" });

    const existingLike = await ActivityLike.findOne({ activity: id, user: userId });

    if (existingLike) {
      await ActivityLike.findByIdAndDelete(existingLike._id);
      a.stats.likes = Math.max(0, (a.stats.likes || 0) - 1);
      await a.save();
      return res.json({ ok: true, liked: false, stats: { likes: a.stats.likes } });
    } else {
      await ActivityLike.create({ activity: id, user: userId });
      a.stats.likes = (a.stats.likes || 0) + 1;
      await a.save();
      return res.json({ ok: true, liked: true, stats: { likes: a.stats.likes } });
    }
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to toggle like"});
  }
});

/**
 * ✅ POST /api/activities/:id/seen
 */
router.post("/:id/seen", requireAuth, async (req, res) => {
  const userId = userIdOf(req.user);
  const id = req.params.id;

  try {
    const a = await Activity.findById(id);
    if (!a) return res.status(404).json({ ok: false, message: "Activity not found" });

    const existingView = await ActivityView.findOne({ activity: id, user: userId });

    if (!existingView) {
      await ActivityView.create({ activity: id, user: userId });
      a.stats.views = (a.stats.views || 0) + 1;
      await a.save();
    }

    return res.json({ ok: true, stats: { views: a.stats.views } });
  } catch(err) {
    console.error(err);
    res.status(500).json({ok: false, message: "Failed to track view"});
  }
});

/**
 * ✅ DELETE /api/activities/:id
 * Educator only (must own the activity)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  if (!assertEducator(req)) {
    return res.status(403).json({ ok: false, message: "Only educator can delete" });
  }

  const educatorId = userIdOf(req.user);
  const id = req.params.id;

  try {
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ ok: false, message: "Activity not found" });
    }

    if (activity.educator.toString() !== educatorId) {
      return res.status(403).json({ ok: false, message: "Unauthorized to delete this activity" });
    }

    await Activity.findByIdAndDelete(id);
    res.json({ ok: true, message: "Activity deleted successfully" });
  } catch (err) {
    console.error("Delete activity error:", err);
    res.status(500).json({ ok: false, message: "Failed to delete activity" });
  }
});

module.exports = router;
