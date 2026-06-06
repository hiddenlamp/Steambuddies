const mongoose = require("mongoose");

const manualSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true, trim: true },
      hi: { type: String, trim: true, default: "" },
    },
    description: {
      en: { type: String, trim: true, default: "" },
      hi: { type: String, trim: true, default: "" },
    },

    category: { type: String, trim: true, default: "" },
    grade: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],

    fileUrl: { type: String, required: true },
    fileName: { type: String, trim: true, default: "" },

    isPublished: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Manual", manualSchema);
