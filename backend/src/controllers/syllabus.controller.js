// src/controllers/syllabus.controller.js
const path = require("path");
const fs = require("fs");
const Syllabus = require("../models/Syllabus.model");

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

// ✅ Educator create syllabus
exports.createSyllabus = async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("PDF file required");

    const titleEn = String(req.body.titleEn || "").trim();
    if (!titleEn) throw badRequest("titleEn required");

    const classLevel = String(req.body.classLevel || "").trim();
    if (!classLevel) throw badRequest("classLevel required");

    const subject = String(req.body.subject || "").trim();
    const visibility = String(req.body.visibility || "all").trim();
    const filename = req.file.filename;

    const doc = await Syllabus.create({
      title: { en: titleEn, hi: String(req.body.titleHi || "") },
      desc: { en: String(req.body.descEn || ""), hi: String(req.body.descHi || "") },
      classLevel,
      subject,

      fileKey: filename,
      fileUrl: `/uploads/${filename}`, // served via app.js static
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,

      visibility,

      createdBy: req.user.id, // from requireAuth middleware
    });

    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: null, // Global
      title: { 
        en: "New Syllabus Uploaded!", 
        hi: "नया पाठ्यक्रम अपलोड किया गया!" 
      },
      message: { 
        en: `A new syllabus has been added: ${titleEn}`, 
        hi: `एक नया पाठ्यक्रम जोड़ा गया है: ${req.body.titleHi || titleEn}`
      },
      type: "note",
      relatedId: doc._id,
      sender: req.user.id
    });

    const io = req.app.get("io");
    if (io) io.emit("new_notification");

    return res.status(201).json({ item: doc });
  } catch (err) {
    return next(err);
  }
};

// ✅ Educator list own syllabuses
exports.listMySyllabuses = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const classLevel = String(req.query.classLevel || "").trim();

    const where = { createdBy: req.user.id, isActive: true };
    if (classLevel) where.classLevel = classLevel;

    if (q) {
      where.$or = [
        { "title.en": { $regex: q, $options: "i" } },
        { "title.hi": { $regex: q, $options: "i" } },
        { "desc.en": { $regex: q, $options: "i" } },
        { "desc.hi": { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
      ];
    }

    const items = await Syllabus.find(where).sort({ createdAt: -1 }).limit(200);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

// ✅ Student list syllabuses
exports.listForStudents = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const classLevel = String(req.query.classLevel || "").trim();

    const where = { isActive: true };

    // visibility targeting
    where.$or = [
      { visibility: "all" },
      ...(classLevel ? [{ visibility: "classLevel", classLevel }] : []),
    ];

    if (q) {
      where.$and = [
        ...(where.$and || []),
        {
          $or: [
            { "title.en": { $regex: q, $options: "i" } },
            { "title.hi": { $regex: q, $options: "i" } },
            { "desc.en": { $regex: q, $options: "i" } },
            { "desc.hi": { $regex: q, $options: "i" } },
            { subject: { $regex: q, $options: "i" } },
          ],
        },
      ];
    }

    const items = await Syllabus.find(where).sort({ createdAt: -1 }).limit(300);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

// ✅ Download endpoint (streams PDF + increments downloads)
exports.downloadSyllabus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Syllabus.findOne({ _id: id, isActive: true });
    if (!item) return res.status(404).json({ message: "Not found" });

    // increment downloads (async)
    Syllabus.updateOne({ _id: id }, { $inc: { downloads: 1 } }).catch(() => {});

    const filePath = path.join(process.cwd(), "uploads", item.fileKey);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(item.title?.en || "syllabus").replace(/\s+/g, "_")}.pdf"`
    );

    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return next(err);
  }
};

// ✅ Educator delete (soft delete)
exports.deleteSyllabus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Syllabus.findOne({ _id: id, createdBy: req.user.id });
    if (!item) return res.status(404).json({ message: "Not found" });

    item.isActive = false;
    await item.save();

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
