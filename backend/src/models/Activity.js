const mongoose = require("mongoose");

const LS = new mongoose.Schema(
  { en: { type: String, default: "" }, hi: { type: String, default: "" } },
  { _id: false }
);

const ActivitySchema = new mongoose.Schema(
  {
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["image", "video", "text"], required: true },

    badge: { type: LS, default: () => ({ en: "STEAM", hi: "स्टेम" }) },
    title: { type: LS, default: () => ({ en: "", hi: "" }) },
    caption: { type: LS, default: () => ({ en: "", hi: "" }) },

    mediaUrl: { type: String, default: "" }, // image/video url for type=image/video
    durationSec: { type: Number, default: 12, min: 3, max: 60 },

    // optional expiry like stories
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },

    // cached counters (fast UI)
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
    },

    targetSchools: [{ type: String, trim: true }], // If empty, visible to all
    targetClasses: [{ type: String, trim: true }], // If empty, visible to all
  },
  { timestamps: true }
);

ActivitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ActivitySchema.index({ educator: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", ActivitySchema);
Activity.syncIndexes();
module.exports = Activity;
