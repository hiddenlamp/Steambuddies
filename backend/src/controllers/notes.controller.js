// src/controllers/notes.controller.js
const path = require("path");
const fs = require("fs");
const Note = require("../models/Note.model");

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function normalizeVisibility(body) {
  const visibility = body.visibility || "all";
  const gradeGroup = body.gradeGroup || "";
  const courseId = body.courseId || "";

  if (visibility === "gradeGroup" && !gradeGroup) throw badRequest("gradeGroup required");
  if (visibility === "course" && !courseId) throw badRequest("courseId required");

  return { visibility, gradeGroup, courseId };
}

// ✅ Educator create note
exports.createNote = async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("PDF file required");

    const titleEn = String(req.body.titleEn || "").trim();
    if (!titleEn) throw badRequest("titleEn required");

    const tag = String(req.body.tag || "").trim();
    if (!tag) throw badRequest("tag required");

    const mins = Math.max(parseInt(req.body.mins || "5", 10) || 5, 1);

    const { visibility, gradeGroup, courseId } = normalizeVisibility(req.body);

    const filename = req.file.filename;

    const doc = await Note.create({
      title: { en: titleEn, hi: String(req.body.titleHi || "") },
      desc: { en: String(req.body.descEn || ""), hi: String(req.body.descHi || "") },
      tag,
      mins,

      fileKey: filename,
      fileUrl: `/uploads/${filename}`, // served via app.js static
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,

      visibility,
      gradeGroup,
      courseId: courseId ? courseId : null,

      createdBy: req.user.id, // from requireAuth middleware
    });

    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: null, // Global
      title: { 
        en: "New Note Uploaded!", 
        hi: "नया नोट अपलोड किया गया!" 
      },
      message: { 
        en: `A new study note has been added: ${titleEn}`, 
        hi: `एक नया अध्ययन नोट जोड़ा गया है: ${req.body.titleHi || titleEn}`
      },
      type: "note",
      relatedId: doc._id,
      sender: req.user.id
    });

    return res.status(201).json({ note: doc });
  } catch (err) {
    return next(err);
  }
};

// ✅ Educator list own notes
exports.listMyNotes = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const tag = String(req.query.tag || "").trim();

    const where = { createdBy: req.user.id, isActive: true };
    if (tag) where.tag = tag;

    if (q) {
      where.$or = [
        { "title.en": { $regex: q, $options: "i" } },
        { "title.hi": { $regex: q, $options: "i" } },
        { "desc.en": { $regex: q, $options: "i" } },
        { "desc.hi": { $regex: q, $options: "i" } },
      ];
    }

    const items = await Note.find(where).sort({ createdAt: -1 }).limit(200);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

// ✅ Student list notes
exports.listForStudents = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const tag = String(req.query.tag || "").trim();
    const gradeGroup = String(req.query.gradeGroup || "").trim();
    const courseId = String(req.query.courseId || "").trim();

    const where = { isActive: true };
    if (tag) where.tag = tag;

    // visibility targeting
    where.$or = [
      { visibility: "all" },
      ...(gradeGroup ? [{ visibility: "gradeGroup", gradeGroup }] : []),
      ...(courseId ? [{ visibility: "course", courseId }] : []),
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
          ],
        },
      ];
    }

    const items = await Note.find(where).sort({ createdAt: -1 }).limit(300);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

// ✅ Download endpoint (streams PDF + increments downloads)
exports.downloadNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOne({ _id: id, isActive: true });
    if (!note) return res.status(404).json({ message: "Not found" });

    // increment downloads (async)
    Note.updateOne({ _id: id }, { $inc: { downloads: 1 } }).catch(() => {});

    const filePath = path.join(process.cwd(), "uploads", note.fileKey);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(note.title?.en || "note").replace(/\s+/g, "_")}.pdf"`
    );

    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return next(err);
  }
};

// ✅ Educator delete (soft delete)
exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOne({ _id: id, createdBy: req.user.id });
    if (!note) return res.status(404).json({ message: "Not found" });

    note.isActive = false;
    await note.save();

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
