const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // If recipient is null, it's a global notification for all students
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    title: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    message: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    type: { 
      type: String, 
      enum: ["course", "note", "manual", "announcement", "system", "doubt", "reel"],
      default: "system"
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of the course, note, etc.
    
    // Who sent it
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // For global notifications, track who has already read it
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // For direct notifications
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index for quickly retrieving global notifications and user-specific ones
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
