const mongoose = require("mongoose");

const LangSchema = new mongoose.Schema(
  { en: { type: String, default: "" }, hi: { type: String, default: "" } },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: LangSchema, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: "" },

    level: { type: LangSchema, default: () => ({ en: "", hi: "" }) },
    duration: { type: LangSchema, default: () => ({ en: "", hi: "" }) },

    outcomes: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    videoUrl: { type: String, required: true },
    thumbUrl: { type: String, default: "" },
    resourceUrl: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    educatorName: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
