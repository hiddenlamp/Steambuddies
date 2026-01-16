import mongoose from "mongoose";

const ActivityViewSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ActivityViewSchema.index({ activity: 1, user: 1 }, { unique: true });

export default mongoose.model("ActivityView", ActivityViewSchema);
