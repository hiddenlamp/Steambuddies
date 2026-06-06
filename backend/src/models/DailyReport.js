const mongoose = require("mongoose");

const DailyReportSchema = new mongoose.Schema(
  {
    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    studentCount: {
      type: Number,
      required: true,
      min: 0,
    },
    classesTaught: {
      type: String, // e.g., "Class 5, Class 6"
      required: true,
    },
    topicsTaught: {
      type: String,
      required: true,
    },
    projectBuilt: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // Array of image URLs/paths
      required: true,
      validate: {
        validator: function(v) {
          return v.length > 0 && v.length <= 5; // Allow 1-5 images just to be safe
        },
        message: 'Must provide at least 1 image and no more than 5'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyReport", DailyReportSchema);
