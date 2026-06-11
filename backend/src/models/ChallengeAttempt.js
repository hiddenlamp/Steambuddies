const mongoose = require("mongoose");

const challengeAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    awardedPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent multiple attempts on the same challenge by the same student
challengeAttemptSchema.index({ studentId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model("ChallengeAttempt", challengeAttemptSchema);
