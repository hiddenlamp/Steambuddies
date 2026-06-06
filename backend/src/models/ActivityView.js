const mongoose = require("mongoose");

const ActivityViewSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ prevent duplicate views (same user + same activity)
ActivityViewSchema.index({ activity: 1, user: 1 }, { unique: true });

// ✅ nodemon-safe export
module.exports =
  mongoose.models.ActivityView ||
  mongoose.model("ActivityView", ActivityViewSchema);
