// src/controllers/reels.controller.js
const Reel = require("../models/Reel");

// Create a new Short (Reel)
exports.createReel = async (req, res) => {
  try {
    const { mediaType, mediaUrl, textContent, bgColor, caption } = req.body;
    
    let finalMediaUrl = mediaUrl || req.body.videoUrl || "";
    if (req.file) {
      finalMediaUrl = `/uploads/reels/${req.file.filename}`;
    }

    const user = req.user;
    let initialStatus = "approved";
    if (user.role === "student") {
      initialStatus = "pending";
    }

    const newReel = await Reel.create({
      authorId: user.id,
      mediaType: mediaType || "video",
      mediaUrl: finalMediaUrl,
      textContent,
      bgColor,
      caption,
      status: initialStatus,
      schoolId: user.schoolId || null
    });
    
    // Populate authorId so the frontend gets user info immediately
    await newReel.populate("authorId", "fullName profilePic");

    if (initialStatus === "approved") {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipient: null, // Global notification
        title: { en: "New STEAM Short!" },
        message: { en: `${user.fullName} posted a new STEAM Short.` },
        type: "reel",
        relatedId: newReel._id,
        sender: user.id
      });
      const io = req.app.get("io");
      if (io) io.emit("new_notification");
    } else if (initialStatus === "pending") {
      // Send notification to educators of the same school
      const Notification = require("../models/Notification");
      const User = require("../models/User");
      
      if (user.schoolId) {
        const educators = await User.find({ role: "educator", schoolId: user.schoolId });
        for (const educator of educators) {
          await Notification.create({
            recipient: educator._id,
            title: { en: "New Story Pending Approval" },
            message: { en: `${user.fullName} has submitted a new story.` },
            type: "reel",
            relatedId: newReel._id,
            sender: user.id
          });
        }
        const io = req.app.get("io");
        if (io) io.emit("new_notification");
      }
    }

    res.status(201).json({ ok: true, reel: newReel });
  } catch (err) {
    console.error("Create reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to create reel" });
  }
};

// Get my shorts
exports.getMyReels = async (req, res) => {
  try {
    const reels = await Reel.find({ 
      $and: [
        { authorId: req.user.id },
        { $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }] }
      ]
    })
    .populate("authorId", "fullName profilePic")
    .populate("viewers", "fullName profilePic name")
    .sort({ createdAt: -1 });
    res.status(200).json({ ok: true, reels });
  } catch (err) {
    console.error("Get my reels error:", err);
    res.status(500).json({ ok: false, message: "Failed to get reels" });
  }
};

// Get all shorts
exports.getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find({
      $and: [
        {
          $or: [
            { status: "approved" },
            { authorId: req.user.id }
          ]
        },
        {
          $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }]
        }
      ]
    })
      .populate("authorId", "fullName profilePic")
      .populate("viewers", "fullName profilePic name")
      .sort({ createdAt: -1 })
      .lean();
      
    // Normalize data for frontend
    const normalizedReels = reels.map(r => ({
      ...r,
      authorId: r.authorId,
    }));
    
    res.status(200).json({ ok: true, reels: normalizedReels });
  } catch (err) {
    console.error("Get all reels error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch reels" });
  }
};

// Like a short
exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    const io = req.app.get("io");
    if (io) {
      io.emit("reel_liked", { id: reel._id, likes: reel.likes });
    }
    res.status(200).json({ ok: true, reel });
  } catch (err) {
    console.error("Like reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to like reel" });
  }
};

// Seen a short
exports.seenReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      id,
      { 
        $addToSet: { viewers: req.user.id },
        $inc: { views: 1 } 
      },
      { new: true }
    ).populate("viewers", "fullName profilePic name");
    
    const io = req.app.get("io");
    if (io) {
      io.emit("reel_seen", { id: reel._id, views: reel.views, viewerId: req.user.id });
    }

    res.status(200).json({ ok: true, reel });
  } catch (err) {
    console.error("Seen reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to mark seen" });
  }
};

// Delete a short
exports.deleteReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ ok: false, message: "Reel not found" });

    // Check ownership
    if (reel.authorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized to delete this reel" });
    }

    await Reel.findByIdAndDelete(id);
    res.status(200).json({ ok: true, message: "Reel deleted successfully" });
  } catch (err) {
    console.error("Delete reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to delete reel" });
  }
};

// ======================= EDUCATOR MODERATION ======================= //

// Get pending shorts for educator's assigned schools
exports.getPendingReels = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "educator" && user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    let filter = { status: "pending" };
    
    // If educator, only show pending reels from their assigned schools
    if (user.role === "educator") {
      const assignedSchools = user.assignedSchools || [];
      // To match strings or ObjectIds, we might need a lookup if schoolId is ObjectId
      // Assuming the user model stores assignedSchools as string names or IDs.
      // Let's rely on school names if possible, but the Reel has schoolId.
      // Wait, let's just fetch pending reels where author's school matches assigned schools.
      
      const User = require("../models/User");
      const studentsInSchools = await User.find({ school: { $in: assignedSchools } }).select("_id");
      const studentIds = studentsInSchools.map(s => s._id);
      
      filter.authorId = { $in: studentIds };
    }

    const reels = await Reel.find(filter)
      .populate("authorId", "fullName profilePic school classLevel")
      .sort({ createdAt: -1 });

    res.status(200).json({ ok: true, reels });
  } catch (err) {
    console.error("Get pending reels error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch pending reels" });
  }
};

// Approve a short
exports.approveReel = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "educator" && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const reel = await Reel.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    ).populate("authorId", "fullName profilePic");
    if (!reel) return res.status(404).json({ ok: false, message: "Reel not found" });

    // Notify about the approved reel
    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: reel.authorId._id,
      title: { en: "Story Approved!" },
      message: { en: `Your STEAM Short has been approved by your educator and is now public.` },
      type: "reel",
      relatedId: reel._id,
      sender: req.user.id
    });
    // Also broadcast to everyone that a new reel is out
    await Notification.create({
      recipient: null,
      title: { en: "New STEAM Short!" },
      message: { en: `${reel.authorId.fullName} posted a new STEAM Short.` },
      type: "reel",
      relatedId: reel._id,
      sender: req.user.id
    });
    const io = req.app.get("io");
    if (io) io.emit("new_notification");

    res.json({ ok: true, reel });
  } catch (err) {
    console.error("Approve reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to approve reel" });
  }
};

// Reject a short
exports.rejectReel = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "educator" && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const reel = await Reel.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!reel) return res.status(404).json({ ok: false, message: "Reel not found" });

    res.status(200).json({ ok: true, reel });
  } catch (err) {
    console.error("Reject reel error:", err);
    res.status(500).json({ ok: false, message: "Failed to reject reel" });
  }
};

