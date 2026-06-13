// src/models/Syllabus.model.js
const mongoose = require("mongoose");

const SyllabusSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    desc: {
      en: { type: String, default: "" },
      hi: { type: String, default: "" },
    },

    classLevel: { type: String, required: true, index: true }, // e.g., 'c2', 'c3', 'c4' ... 'c12'
    subject: { type: String, default: "" },

    fileKey: { type: String, required: true }, // filename in uploads
    fileUrl: { type: String, required: true }, // "/uploads/<filename>" or api url

    mimeType: { type: String, default: "application/pdf" },
    sizeBytes: { type: Number, default: 0 },

    visibility: {
      type: String,
      enum: ["all", "classLevel"],
      default: "all",
      index: true,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Syllabus", SyllabusSchema);
