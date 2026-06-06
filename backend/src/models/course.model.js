// src/models/course.model.js
const mongoose = require("mongoose");

const LocalizedStringSchema = new mongoose.Schema(
  {
    en: { type: String, default: "" },
    hi: { type: String, default: "" },
  },
  { _id: false }
);

const CourseLessonSchema = new mongoose.Schema(
  {
    title: { type: LocalizedStringSchema, required: true },
  },
  { _id: false }
);

const CourseSectionSchema = new mongoose.Schema(
  {
    title: { type: LocalizedStringSchema, required: true },
    lessons: { type: [CourseLessonSchema], default: () => [] },
  },
  { _id: false }
);

const CourseVideoSchema = new mongoose.Schema(
  {
    title: { type: LocalizedStringSchema, required: true },
    provider: {
      type: String,
      enum: ["youtube", "vimeo", "file", "other"],
      default: "youtube",
    },
    freePreview: { type: Boolean, default: false },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const CourseMetaSchema = new mongoose.Schema(
  {
    lectures: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    language: { type: [String], default: () => ["en", "hi"] },
    certificate: { type: Boolean, default: true },
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, index: true },
    gradeGroup: { type: String, required: true, index: true },

    title: { type: LocalizedStringSchema, required: true },
    level: { type: String, default: "Beginner" },

    // ✅ default object should be a function
    duration: { type: LocalizedStringSchema, default: () => ({ en: "", hi: "" }) },

    meta: { type: CourseMetaSchema, default: () => ({}) },

    skills: { type: [String], default: () => [] },

    // ✅ default object should be a function
    description: { type: LocalizedStringSchema, default: () => ({ en: "", hi: "" }) },

    includes: { type: [LocalizedStringSchema], default: () => [] },
    projects: { type: [String], default: () => [] },

    curriculum: { type: [CourseSectionSchema], default: () => [] },
    videos: { type: [CourseVideoSchema], default: () => [] },

    // ✅ default object should be a function
    badge: { type: LocalizedStringSchema, default: () => ({ en: "", hi: "" }) },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    // ✅ ownership checks
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ audit
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ✅ Useful indexes
CourseSchema.index({ status: 1, createdAt: -1 });
CourseSchema.index({ createdBy: 1, updatedAt: -1 });

module.exports = mongoose.models.Course || mongoose.model("Course", CourseSchema);
