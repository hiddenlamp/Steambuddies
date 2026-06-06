import MockAttempt from "../models/MockAttempt.js";
import User from "../models/User.js";

export async function buildLeaderboard(testId) {
  const attempts = await MockAttempt.find({ testId, status: "submitted" })
    .select("studentId score maxScore percentage")
    .sort({ score: -1, percentage: -1, submittedAt: 1 })
    .lean();

  const ids = attempts.map((a) => a.studentId);
  const users = await User.find({ _id: { $in: ids } }).select("fullName name").lean();
  const nameMap = new Map(users.map((u) => [String(u._id), u.fullName || u.name || "Student"]));

  let rank = 0;
  const rows = attempts.map((a, i) => {
    rank = i + 1;
    return {
      studentId: a.studentId,
      name: nameMap.get(String(a.studentId)) || "Student",
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      rank
    };
  });

  return { testId, rows, generatedAt: new Date() };
}
