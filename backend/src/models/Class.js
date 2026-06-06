import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "6", "7", "8"
    section: { type: String }, // optional "A"
  },
  { timestamps: true }
);

// unique combo label+section
classSchema.index({ label: 1, section: 1 }, { unique: true, sparse: true });

export default mongoose.model("Class", classSchema);
