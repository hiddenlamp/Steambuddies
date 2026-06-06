import MockTest from "../models/MockTest.js";
import MockAttempt from "../models/MockAttempt.js";
import Leaderboard from "../models/Leaderboard.js";
import { scoreAttempt } from "../services/scoring.service.js";
import { shuffleArray } from "../utils/id.js";

function now() {
  return new Date();
}

export async function listAvailable(req, res) {
  const tests = await MockTest.find({ status: "published" })
    .select("title subject topics durationMinutes startAt endAt leaderboardPublished")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ tests });
}

export async function startAttempt(req, res) {
  const test = await MockTest.findOne({ _id: req.params.id, status: "published" }).lean();
  if (!test) return res.status(404).json({ message: "Not found" });

  // optional schedule enforcement
  if (test.startAt && now() < new Date(test.startAt)) return res.status(400).json({ message: "Test not started yet" });
  if (test.endAt && now() > new Date(test.endAt)) return res.status(400).json({ message: "Test ended" });

  // create deterministic order snapshot
  let order = test.questions.map((q) => q.qid);
  if (test.shuffleQuestions) order = shuffleArray(order);

  const optionOrderMap = new Map();
  for (const q of test.questions) {
    const base = [0, 1, 2, 3];
    optionOrderMap.set(q.qid, test.shuffleOptions ? shuffleArray(base) : base);
  }

  const attempt = await MockAttempt.findOneAndUpdate(
    { testId: test._id, studentId: req.user.id },
    {
      $setOnInsert: {
        testId: test._id,
        studentId: req.user.id,
        startedAt: now(),
        questionOrder: order,
        optionOrderMap,
        status: "in_progress"
      }
    },
    { upsert: true, new: true }
  ).lean();

  // Return “paper view” without answers
  const qMap = new Map(test.questions.map((q) => [q.qid, q]));
  const paper = attempt.questionOrder.map((qid) => {
    const q = qMap.get(qid);
    const ord = attempt.optionOrderMap[qid] || [0, 1, 2, 3];
    const options = ord.map((i) => q.options[i]);
    return {
      qid,
      question: q.question,
      options,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks
    };
  });

  res.json({
    attemptId: attempt._id,
    startedAt: attempt.startedAt,
    durationMinutes: test.durationMinutes,
    paper
  });
}

export async function submitAttempt(req, res) {
  const { answers = [] } = req.body; // [{qid, chosenIndex}]
  const attempt = await MockAttempt.findOne({ testId: req.params.id, studentId: req.user.id });
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });
  if (attempt.status === "submitted") return res.json({ message: "Already submitted", attempt });

  const test = await MockTest.findOne({ _id: req.params.id, status: "published" });
  if (!test) return res.status(404).json({ message: "Test not found" });

  const scored = scoreAttempt({ test, attempt, submittedAnswers: answers });

  attempt.answers = scored.answers;
  attempt.score = scored.score;
  attempt.maxScore = scored.maxScore;
  attempt.percentage = scored.percentage;
  attempt.submittedAt = new Date();
  attempt.status = "submitted";
  await attempt.save();

  res.json({
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage
  });
}

export async function getLeaderboardForStudent(req, res) {
  const test = await MockTest.findOne({ _id: req.params.id, status: "published" }).lean();
  if (!test) return res.status(404).json({ message: "Not found" });

  if (!test.leaderboardPublished) return res.json({ leaderboard: null });

  const lb = await Leaderboard.findOne({ testId: test._id }).lean();
  res.json({ leaderboard: lb || null });
}
