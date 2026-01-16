import mongoose from "mongoose";

const ActivityLikeSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ActivityLikeSchema.index({ activity: 1, user: 1 }, { unique: true });

export default mongoose.model("ActivityLike", ActivityLikeSchema);
