// src/routes/activities.routes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * TEMP in-memory store (DEV)
 */
const store = {
  activities: [],            // newest first
  likesByUser: new Map(),    // `${userId}:${activityId}` => true
  seenByUser: new Set(),     // `${userId}:${activityId}`
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const roleOf = (u) => String(u?.role || "").toLowerCase();
const userIdOf = (u) => String(u?._id || u?.id || "guest");

function assertEducator(req) {
  const r = roleOf(req.user);
  return r === "educator" || r === "admin";
}

function toClientActivity(a, user) {
  const userId = userIdOf(user);
  const likedKey = `${userId}:${a.id}`;
  const seenKey = `${userId}:${a.id}`;

  return {
    id: a.id,
    type: a.type,
    src: a.src || "",
    title: a.title || { en: "", hi: "" },
    caption: a.caption || { en: "", hi: "" },
    badge: a.badge || { en: "STEAM", hi: "STEAM" },
    durationSec: a.durationSec ?? 12,
    bgIndex: a.bgIndex ?? 0,
    educator: a.educator || { id: "educator", name: "Educator", avatarLetter: "E" },
    stats: {
      views: a.stats?.views ?? 0,
      likes: a.stats?.likes ?? 0,
    },
    my: {
      liked: !!store.likesByUser.get(likedKey),
      seen: store.seenByUser.has(seenKey),
    },
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
    cb(null, `${Date.now()}-${uid()}${ext}`);
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

// ✅ Safe multer wrapper (prevents server crash / white page)
function uploadSingleSafe(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();

      // Multer specific error
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ ok: false, message: "File too large (max 50MB)" });
        }
        return res.status(400).json({ ok: false, message: "Invalid file. Only image/video allowed." });
      }

      // Generic error
      return res.status(400).json({ ok: false, message: err.message || "Upload failed" });
    });
  };
}

/**
 * ✅ GET /api/activities/feed
 * Public feed (optional login)
 */
router.get("/feed", async (req, res) => {
  const user = req.user || { id: "guest" };
  const list = store.activities.slice(0, 50).map((a) => toClientActivity(a, user));
  return res.json({ ok: true, activities: list });
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

  const list = store.activities
    .filter((a) => a.educator?.id === me)
    .slice(0, 100)
    .map((a) => toClientActivity(a, { id: me }));

  return res.json({ ok: true, activities: list });
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
  const bgIndex = Number(req.body.bgIndex || 0);

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

  const activity = {
    id: uid(),
    type,
    src,
    title,
    caption,
    badge,
    durationSec: Math.max(5, Math.min(durationSec, 60)),
    bgIndex: Math.max(0, Math.min(bgIndex, 2)),
    educator: {
      id: educatorId,
      name: req.user.name || "Educator",
      avatarLetter: (req.user.name?.[0] || "E").toUpperCase(),
    },
    stats: { views: 0, likes: 0 },
    createdAt: new Date().toISOString(),
  };

  store.activities.unshift(activity);

  return res.status(201).json({
    ok: true,
    message: "Activity created",
    activity: toClientActivity(activity, { id: educatorId }),
  });
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

  const idx = store.activities.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, message: "Activity not found" });

  const a = store.activities[idx];
  if (role !== "admin" && a.educator?.id !== me) {
    return res.status(403).json({ ok: false, message: "Not allowed" });
  }

  if (a.src?.startsWith("/uploads/activities/")) {
    const filename = a.src.split("/uploads/activities/")[1];
    const fp = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  store.activities.splice(idx, 1);
  return res.json({ ok: true, message: "Activity deleted" });
});

/**
 * ✅ POST /api/activities/:id/like
 */
router.post("/:id/like", requireAuth, async (req, res) => {
  const userId = userIdOf(req.user);
  const id = req.params.id;

  const a = store.activities.find((x) => x.id === id);
  if (!a) return res.status(404).json({ ok: false, message: "Activity not found" });

  const key = `${userId}:${id}`;
  const before = !!store.likesByUser.get(key);

  if (before) {
    store.likesByUser.delete(key);
    a.stats.likes = Math.max(0, (a.stats.likes || 0) - 1);
  } else {
    store.likesByUser.set(key, true);
    a.stats.likes = (a.stats.likes || 0) + 1;
  }

  return res.json({ ok: true, liked: !before, stats: { likes: a.stats.likes } });
});

/**
 * ✅ POST /api/activities/:id/seen
 */
router.post("/:id/seen", requireAuth, async (req, res) => {
  const userId = userIdOf(req.user);
  const id = req.params.id;

  const a = store.activities.find((x) => x.id === id);
  if (!a) return res.status(404).json({ ok: false, message: "Activity not found" });

  const key = `${userId}:${id}`;
  if (!store.seenByUser.has(key)) {
    store.seenByUser.add(key);
    a.stats.views = (a.stats.views || 0) + 1;
  }

  return res.json({ ok: true, stats: { views: a.stats.views } });
});

module.exports = router;
