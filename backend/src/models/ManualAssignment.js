const mongoose = require("mongoose");

const ManualAssignmentSchema = new mongoose.Schema(
  {
    manualId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manual",
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
    collection: "manualassignments",
  }
);

ManualAssignmentSchema.index(
  { manualId: 1, schoolId: 1, classLevel: 1 },
  { unique: true }
);

module.exports = mongoose.model("ManualAssignment", ManualAssignmentSchema);