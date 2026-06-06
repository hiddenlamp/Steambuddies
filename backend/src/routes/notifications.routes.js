const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

/**
 * GET /api/notifications
 * Fetch notifications for the logged-in student.
 * Retrieves global notifications and direct notifications, ordered by newest.
 */
router.get("/", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch global notifications (recipient = null) OR direct notifications (recipient = userId)
    const notifications = await Notification.find({
      $or: [
        { recipient: null },
        { recipient: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "fullName role")
    .lean();

    // Map them to include an isRead flag
    const mapped = notifications.map(n => {
      // If it's global, check if userId is in readBy array
      if (n.recipient === null) {
        const hasRead = n.readBy && n.readBy.some(id => id.toString() === userId);
        return { ...n, isRead: hasRead };
      }
      // If it's direct, just return the existing isRead
      return n;
    });

    return res.json({ ok: true, notifications: mapped });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ ok: false, message: "Failed to fetch notifications" });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read.
 */
router.post("/:id/read", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid ID" });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ ok: false, message: "Notification not found" });
    }

    if (notification.recipient === null) {
      // Global notification: add user to readBy array if not already present
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
        await notification.save();
      }
    } else {
      // Direct notification: ensure recipient matches and update isRead
      if (notification.recipient.toString() !== userId) {
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }
      notification.isRead = true;
      await notification.save();
    }

    return res.json({ ok: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    return res.status(500).json({ ok: false, message: "Failed to mark as read" });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all unread notifications as read.
 */
router.post("/read-all", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Mark all direct notifications as read
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // 2. Mark all global notifications as read (by adding user to readBy)
    await Notification.updateMany(
      { recipient: null, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return res.json({ ok: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({ ok: false, message: "Failed to mark all as read" });
  }
});

module.exports = router;
