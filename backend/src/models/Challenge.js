const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }, // 0-based index
    points: { type: Number, default: 40 },
    theme: { type: String, enum: ["cyan", "purple", "orange", "emerald", "rose"], default: "cyan" },
    activeDate: { type: Date, required: true, default: Date.now }, // Date the challenge is for
    targetSchools: [{ type: String, trim: true }], // Array of school names. If empty, visible to all.
    targetClasses: [{ type: String, trim: true }], // Array of class levels e.g., 'Class 2'. If empty, visible to all.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);
