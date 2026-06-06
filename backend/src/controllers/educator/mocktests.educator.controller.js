// src/controllers/mocktests.educator.controller.js (CommonJS)
const mongoose = require("mongoose");
const MockTest = require("../../models/MockTest");

// ✅ OpenAI generator service (create this file)
let generateQuestionsWithOpenAI = null;
try {
  // eslint-disable-next-line global-require
  ({ generateQuestionsWithOpenAI } = require("../../services/openaiQuestions.service"));
} catch (e) {
  // service not present yet → fallback will work
  generateQuestionsWithOpenAI = null;
}

// ---------------- helpers ----------------
const isValidObjId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toObjId = (id) => (isValidObjId(id) ? new mongoose.Types.ObjectId(String(id)) : null);

const getEducatorId = (req) => req.user?._id || req.auth?._id || req.userId || null;

async function ensureOwnedTest(testId, educatorId) {
  if (!testId || !educatorId) return null;
  return MockTest.findOne({ _id: testId, createdBy: educatorId });
}

function normalizeTopics(topics) {
  return (Array.isArray(topics) ? topics : [])
    .map((t) => String(t || "").trim())
    .filter(Boolean);
}

function normalizeQuestionItem(q = {}) {
  const options = Array.isArray(q.options) ? q.options.map((x) => String(x)) : [];
  const correctIndexNum = Number(q.correctIndex);
  const safeCorrect = Number.isFinite(correctIndexNum) ? correctIndexNum : 0;

  const maxIdx = options.length ? options.length - 1 : 0;

  return {
    topic: String(q.topic || "").trim(),
    question: String(q.question || "").trim(),
    options,
    correctIndex: Math.max(0, Math.min(maxIdx, safeCorrect)),
    explanation: String(q.explanation || ""),
  };
}

function clamp(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

// ---------------- controllers ----------------

exports.listMyTests = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const items = await MockTest.find({ createdBy: educatorId }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
};

exports.createTest = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const body = req.body || {};

    const title = String(body.title || "").trim();
    const subject = String(body.subject || "").trim();
    const topics = normalizeTopics(body.topics);

    if (!title) return res.status(400).json({ ok: false, message: "Title required" });
    if (!subject) return res.status(400).json({ ok: false, message: "Subject required" });
    if (topics.length === 0) return res.status(400).json({ ok: false, message: "At least 1 topic required" });

    const doc = await MockTest.create({
      createdBy: educatorId,
      title,
      subject,
      topics,
      language: body.language || "en",
      difficulty: body.difficulty || "medium",
      durationMinutes: clamp(body.durationMinutes, 1, 300, 30),
      startAt: body.startAt ?? null,
      endAt: body.endAt ?? null,
      negativeMarking: !!body.negativeMarking,
      instructions: String(body.instructions || ""),
      status: body.status || "draft",
      questions: [],
      totalQuestions: 0,
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    next(e);
  }
};

exports.getTest = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid id" });

    const doc = await ensureOwnedTest(id, educatorId);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item: doc });
  } catch (e) {
    next(e);
  }
};

exports.updateTest = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid id" });

    const patch = req.body || {};

    const allowed = [
      "title",
      "subject",
      "topics",
      "language",
      "difficulty",
      "durationMinutes",
      "totalQuestions",
      "startAt",
      "endAt",
      "negativeMarking",
      "instructions",
      "status",
    ];

    const update = {};
    for (const k of allowed) {
      if (patch[k] !== undefined) update[k] = patch[k];
    }

    if (update.title !== undefined) update.title = String(update.title || "").trim();
    if (update.subject !== undefined) update.subject = String(update.subject || "").trim();
    if (update.topics !== undefined) update.topics = normalizeTopics(update.topics);

    if (update.durationMinutes !== undefined) {
      update.durationMinutes = clamp(update.durationMinutes, 1, 300, 30);
    }

    const doc = await MockTest.findOneAndUpdate({ _id: id, createdBy: educatorId }, update, { new: true });
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item: doc });
  } catch (e) {
    next(e);
  }
};

exports.publishTest = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid id" });

    const doc = await MockTest.findOneAndUpdate(
      { _id: id, createdBy: educatorId },
      { status: "live" },
      { new: true }
    );

    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item: doc });
  } catch (e) {
    next(e);
  }
};

exports.appendQuestions = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const id = toObjId(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "Invalid id" });

    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "items[] required" });
    }

    const normalized = items
      .map(normalizeQuestionItem)
      .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 4);

    if (normalized.length === 0) {
      return res.status(400).json({ ok: false, message: "No valid questions in items[]" });
    }

    const doc = await MockTest.findOneAndUpdate(
      { _id: id, createdBy: educatorId },
      {
        $push: { questions: { $each: normalized } },
        $inc: { totalQuestions: normalized.length },
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    // ✅ safety: align totalQuestions to actual length
    if (Array.isArray(doc.questions)) {
      doc.totalQuestions = doc.questions.length;
      await doc.save();
    }

    return res.json({ ok: true, count: normalized.length, item: doc });
  } catch (e) {
    next(e);
  }
};

// ✅ Generate questions (OpenAI if available, else fallback)
exports.generateQuestions = async (req, res, next) => {
  try {
    const educatorId = getEducatorId(req);
    if (!educatorId) {
      return res.status(401).json({ ok: false, message: "Token missing. Please login again." });
    }

    const testId = toObjId(req.params.id);
    if (!testId) return res.status(400).json({ ok: false, message: "Invalid test id" });

    const owned = await ensureOwnedTest(testId, educatorId);
    if (!owned) return res.status(404).json({ ok: false, message: "Not found" });

    const body = req.body || {};
    const subject = String(body.subject || "").trim();
    const topics = normalizeTopics(body.topics);
    const totalQuestions = clamp(body.totalQuestions ?? body.count, 1, 50, 10);
    const difficulty = body.difficulty || "medium";
    const language = body.language || "en";
    const grade = String(body.grade || "8");

    if (!subject) return res.status(400).json({ ok: false, message: "subject required" });
    if (topics.length === 0) return res.status(400).json({ ok: false, message: "topics[] required" });

    // ---------- MODE A: OpenAI ----------
    if (typeof generateQuestionsWithOpenAI === "function") {
      try {
        const qs = await generateQuestionsWithOpenAI({
          subject,
          topics,
          difficulty,
          count: totalQuestions,
          grade,
          language,
        });

        const items = (Array.isArray(qs) ? qs : []).map((q, i) => ({
          id: q.qid || q.id || `q_${Date.now()}_${i}`,
          topic: q.topic || topics[0] || "",
          question: String(q.question || "").trim(),
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          correctIndex: Number.isFinite(Number(q.correctIndex)) ? Number(q.correctIndex) : 0,
          explanation: String(q.explanation || ""),
        }));

        const cleaned = items.filter((x) => x.question && x.options.length >= 4);

        return res.json({ ok: true, items: cleaned });
      } catch (err) {
        // OpenAI failed → fallback
        // eslint-disable-next-line no-console
        console.error("OpenAI generation failed:", err?.message || err);
      }
    }

    // ---------- MODE B: fallback generator ----------
    const firstTopic = topics[0];
    const items = Array.from({ length: totalQuestions }).map((_, i) => ({
      id: `gen_${Date.now()}_${i}`,
      topic: firstTopic,
      question: `(${difficulty}/${language}) Q${i + 1}: ${subject} - ${firstTopic} related question?`,
      options: [
        `${firstTopic} option A`,
        `${firstTopic} option B`,
        `${firstTopic} option C`,
        `${firstTopic} option D`,
      ],
      correctIndex: 0,
      explanation: `Explanation for Q${i + 1} (fallback generator).`,
    }));

    return res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
};

// placeholders
exports.monitor = async (req, res) => res.json({ ok: true });
exports.getLeaderboardForEducator = async (req, res) => res.json({ ok: true, items: [] });
exports.publishLeaderboard = async (req, res) => res.json({ ok: true });
