// src/models/ProjectAssignment.js
const mongoose = require("mongoose");

const ProjectAssignmentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    classLevel: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "projectassignments",
  }
);

ProjectAssignmentSchema.index(
  { projectId: 1, schoolId: 1, classLevel: 1 },
  { unique: true }
);

module.exports = mongoose.model("ProjectAssignment", ProjectAssignmentSchema);