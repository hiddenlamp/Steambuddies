const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    type: {
      en: { type: String, required: true },
      hi: { type: String, default: "" },
    },
    dateStr: { 
      type: String, 
      required: true,
      // e.g., "25 Dec" or "05 Jan"
    },
    themeColor: {
      type: String,
      default: "indigo",
      // Expected tailwind color names: indigo, cyan, rose, emerald, amber, etc.
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The admin who created it
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
