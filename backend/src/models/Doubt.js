const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderModel: { type: String, required: true, enum: ["User"] }, // User holds both student and educator
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const DoubtSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    classLevel: { type: String, required: true },
    subject: { type: String, default: "General" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Indexes for fast lookup
DoubtSchema.index({ schoolId: 1, status: 1 });
DoubtSchema.index({ studentId: 1 });

module.exports = mongoose.model("Doubt", DoubtSchema);
