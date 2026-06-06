// src/models/MockTest.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    topic: { type: String, default: "" },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const mockTestSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    topics: { type: [String], default: [] },

    language: { type: String, default: "en" },
    difficulty: { type: String, default: "medium" },
    durationMinutes: { type: Number, default: 30 },
    totalQuestions: { type: Number, default: 0 },

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    negativeMarking: { type: Boolean, default: false },
    instructions: { type: String, default: "" },

    status: { type: String, default: "draft", index: true },

    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MockTest || mongoose.model("MockTest", mockTestSchema);
