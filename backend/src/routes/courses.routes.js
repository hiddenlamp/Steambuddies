const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/course.model");

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ------------------ STUDENT PUBLIC ------------------ */

/** List published courses */
router.get("/public", async (req, res) => {
  try {
    const { category, gradeGroup, q } = req.query;

    const filter = { status: "published" };
    if (category) filter.category = category;
    if (gradeGroup) filter.gradeGroup = gradeGroup;

    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), "i");
      filter.$or = [
        { "title.en": rx },
        { "title.hi": rx },
        { "description.en": rx },
        { "description.hi": rx },
      ];
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    return res.json({ ok: true, courses });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/** Get one published course by id */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const course = await Course.findOne({ _id: id, status: "published" });
    if (!course) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, course });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/* ------------------ EDUCATOR (AUTH) ------------------ */

/** My Courses (history) */
router.get("/mine", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return res.json({ ok: true, courses });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/** Get my single course */
router.get("/mine/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const course = await Course.findOne({ _id: id, createdBy: req.user.id });
    if (!course) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, course });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/** Create course */
router.post("/", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user.id };

    // Optional: hard safety defaults
    if (!payload.status) payload.status = "draft";
    if (!payload.meta) payload.meta = { lectures: 0, rating: 0, language: ["en", "hi"], certificate: true };

    const created = await Course.create(payload);

    // Create a global notification
    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: null, // Global
      title: { 
        en: "New Course Available!", 
        hi: "नया कोर्स उपलब्ध है!" 
      },
      message: { 
        en: `A new course has been published: ${payload.title.en}`, 
        hi: `एक नया कोर्स प्रकाशित हुआ है: ${payload.title.hi || payload.title.en}`
      },
      type: "course",
      relatedId: created._id,
      sender: req.user.id
    });

    return res.status(201).json({ ok: true, course: created });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

/** Update course (full replace style) */
router.put("/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const existing = await Course.findOne({ _id: id, createdBy: req.user.id });
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });

    // Prevent changing ownership
    const payload = { ...req.body };
    delete payload.createdBy;

    const updated = await Course.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return res.json({ ok: true, course: updated });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

/** Patch course (best for adding videos day-by-day) */
router.patch("/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const existing = await Course.findOne({ _id: id, createdBy: req.user.id });
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });

    const payload = { ...req.body };
    delete payload.createdBy;

    const updated = await Course.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return res.json({ ok: true, course: updated });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

/** Delete course */
router.delete("/:id", requireAuth, requireRole("educator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const existing = await Course.findOne({ _id: id, createdBy: req.user.id });
    if (!existing) return res.status(404).json({ ok: false, message: "Not found" });

    await Course.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
