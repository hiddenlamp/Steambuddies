// src/models/MockAttempt.js
const mongoose = require("mongoose");

const mockAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true, index: true },

    answers: [
      {
        qIndex: { type: Number, default: 0 },
        selectedIndex: { type: Number, default: -1 },
        isCorrect: { type: Boolean, default: false },
      },
    ],

    score: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MockAttempt || mongoose.model("MockAttempt", mockAttemptSchema);
