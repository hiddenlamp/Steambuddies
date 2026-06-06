import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import MockTest from "../models/MockTest.js";
import Attempt from "../models/Attempt.js";
import User from "../models/User.js";

const r = Router();

function calcScore(test, answers = []) {
  const map = new Map(answers.map(a => [a.qid, a.selectedOptionIds || []]));
  let score = 0;
  let maxScore = 0;

  for (const q of test.questions || []) {
    const selected = (map.get(q.qid) || []).slice().sort();
    const correct = (q.correctOptionIds || []).slice().sort();
    const pts = q.points || 1;
    maxScore += pts;

    const ok =
      selected.length === correct.length &&
      selected.every((v, i) => v === correct[i]);

    if (ok) score += pts;
  }

  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percent };
}

/** STUDENT: start attempt (returns questions WITHOUT answers) */
r.post("/start", requireAuth, requireRole("student"), async (req, res) => {
  const schema = z.object({ testId: z.string() });
  const { testId } = schema.parse(req.body);

  const test = await MockTest.findById(testId).lean();
  if (!test || test.status !== "published") return res.status(404).json({ message: "Test not found" });

  // Optional schedule window checks can be added here

  let attempt = await Attempt.findOne({ testId, studentId: req.user.id });
  if (!attempt) {
    attempt = await Attempt.create({
      testId,
      studentId: req.user.id,
      answers: [],
      maxScore: (test.questions || []).reduce((a, q) => a + (q.points || 1), 0)
    });

    // increment test attempts count (not perfect analytics; ok for now)
    await MockTest.updateOne({ _id: testId }, { $inc: { attemptsCount: 1 } });
  }

  // Hide correctOptionIds/explanations for student
  const safeQuestions = (test.questions || []).map(q => ({
    qid: q.qid,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    topic: q.topic,
    difficulty: q.difficulty,
    points: q.points
  }));

  res.json({
    attemptId: attempt._id,
    test: {
      _id: test._id,
      title: test.title,
      description: test.description,
      durationMins: test.durationMins,
      totalQuestions: test.totalQuestions
    },
    questions: safeQuestions,
    answers: attempt.answers || []
  });
});

/** STUDENT: save an answer + get LIVE score */
r.post("/answer", requireAuth, requireRole("student"), async (req, res) => {
  const schema = z.object({
    attemptId: z.string(),
    qid: z.string(),
    selectedOptionIds: z.array(z.string()).default([])
  });
  const { attemptId, qid, selectedOptionIds } = schema.parse(req.body);

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });
  if (String(attempt.studentId) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });
  if (attempt.finishedAt) return res.status(400).json({ message: "Attempt finished" });

  const idx = (attempt.answers || []).findIndex(a => a.qid === qid);
  if (idx >= 0) attempt.answers[idx].selectedOptionIds = selectedOptionIds;
  else attempt.answers.push({ qid, selectedOptionIds });

  const test = await MockTest.findById(attempt.testId).lean();
  const { score, maxScore, percent } = calcScore(test, attempt.answers);

  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percent = percent;
  await attempt.save();

  res.json({ score, maxScore, percent });
});

/** STUDENT: finish + update user stats */
r.post("/finish", requireAuth, requireRole("student"), async (req, res) => {
  const schema = z.object({ attemptId: z.string() });
  const { attemptId } = schema.parse(req.body);

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });
  if (String(attempt.studentId) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });
  if (attempt.finishedAt) return res.json({ attempt });

  const test = await MockTest.findById(attempt.testId).lean();
  const { score, maxScore, percent } = calcScore(test, attempt.answers);

  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percent = percent;
  attempt.finishedAt = new Date();
  await attempt.save();

  // Update user stats (simple rolling average)
  const user = await User.findById(req.user.id);
  if (user) {
    const prevN = user.stats?.testsAttempted || 0;
    const prevAvg = user.stats?.avgPercent || 0;
    const newN = prevN + 1;
    const newAvg = Math.round((prevAvg * prevN + percent) / newN);

    user.stats.testsAttempted = newN;
    user.stats.avgPercent = newAvg;
    user.stats.lastAttemptAt = new Date();

    // pass condition: >= 40% (change as you want)
    if (percent >= 40) user.stats.testsPassed = (user.stats.testsPassed || 0) + 1;

    await user.save();
  }

  res.json({ attempt });
});

export default r;
