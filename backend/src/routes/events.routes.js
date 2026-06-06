const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /api/events/public
 * Fetch active events for the student dashboard.
 */
router.get("/public", async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ ok: true, events });
  } catch (error) {
    console.error("Fetch public events error:", error);
    return res.status(500).json({ ok: false, message: "Failed to fetch events" });
  }
});

/**
 * GET /api/events
 * Fetch all events (Admin only)
 */
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.json({ ok: true, events });
  } catch (error) {
    console.error("Fetch admin events error:", error);
    return res.status(500).json({ ok: false, message: "Failed to fetch events" });
  }
});

/**
 * POST /api/events
 * Create a new event (Admin only)
 */
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user.id };
    const created = await Event.create(payload);
    return res.status(201).json({ ok: true, event: created });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * PUT /api/events/:id
 * Update an event (Admin only)
 */
router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const payload = { ...req.body };
    delete payload.createdBy; // prevent reassignment

    const updated = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, event: updated });
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(400).json({ ok: false, message: error.message });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event (Admin only)
 */
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Invalid ID" });

    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
