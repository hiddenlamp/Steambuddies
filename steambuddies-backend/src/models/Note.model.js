// src/models/Note.model.js
const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    desc: {
      en: { type: String, default: "" },
      hi: { type: String, default: "" },
    },

    tag: { type: String, required: true, index: true },
    mins: { type: Number, default: 5 },

    fileKey: { type: String, required: true }, // filename in uploads
    fileUrl: { type: String, required: true }, // "/uploads/<filename>" or api url

    mimeType: { type: String, default: "application/pdf" },
    sizeBytes: { type: Number, default: 0 },

    visibility: {
      type: String,
      enum: ["all", "gradeGroup", "course"],
      default: "all",
      index: true,
    },
    gradeGroup: { type: String, default: "" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
