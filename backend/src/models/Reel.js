const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaType: { type: String, enum: ["video", "image", "text"], default: "video" },
    mediaUrl: { type: String, default: "" }, // For video or image
    textContent: { type: String, trim: true, default: "" }, // For text-only
    bgColor: { type: String, default: "from-blue-500 to-purple-500" }, // For text-only background
    caption: { type: String, trim: true, default: "" }, // General caption for video/image
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },

    targetSchools: [{ type: String, trim: true }], // If empty, visible to all
    targetClasses: [{ type: String, trim: true }], // If empty, visible to all
  },
  { timestamps: true }
);

reelSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Reel", reelSchema);
