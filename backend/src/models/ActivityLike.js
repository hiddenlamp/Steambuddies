const mongoose = require("mongoose");

const ActivityLikeSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// ✅ prevent duplicate likes (same user + same activity)
ActivityLikeSchema.index({ activity: 1, user: 1 }, { unique: true });

// ✅ nodemon-safe export
module.exports =
  mongoose.models.ActivityLike ||
  mongoose.model("ActivityLike", ActivityLikeSchema);
