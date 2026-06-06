// src/models/SchoolModel.js
const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    address: { type: String, trim: true },

    city: { type: String, trim: true },
    state: { type: String, trim: true },

    // ✅ THIS IS THE MAIN FIX
    educatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Changed to false so students can auto-create schools during signup
      index: true,
    },

    // ✅ so you can filter active schools
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// optional unique code
// schoolSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("School", schoolSchema);
