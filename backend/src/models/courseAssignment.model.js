// src/models/courseAssignment.model.js
const mongoose = require("mongoose");

const CourseAssignmentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classLevel: {
      type: String,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    expectedWeeks: {
      type: Number,
      default: 8,
    },
    progressPct: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "running", "paused", "completed", "active", "inactive"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "courseassignments",
  }
);

CourseAssignmentSchema.index(
  { schoolId: 1, classLevel: 1, courseId: 1 },
  { unique: true }
);

module.exports = mongoose.model("CourseAssignment", CourseAssignmentSchema);