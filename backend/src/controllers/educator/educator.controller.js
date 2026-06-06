// src/controllers/educator.controller.js
const School = require("../../models/SchoolModel.js"); // adjust name if different

async function listSchools(req, res) {
  try {
    const schools = await School.find({})
      .select("_id name code")
      .sort({ name: 1 });

    return res.json({ ok: true, schools });
  } catch (err) {
    console.error("listSchools error:", err);
    return res.status(500).json({ ok: false, message: "Failed to load schools" });
  }
}

module.exports = {
  listSchools,
};
