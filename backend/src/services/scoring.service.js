export function scoreAttempt({ test, attempt, submittedAnswers }) {
  const qMap = new Map(test.questions.map((q) => [q.qid, q]));
  const aMap = new Map(submittedAnswers.map((a) => [a.qid, a.chosenIndex]));

  let score = 0;
  let maxScore = 0;

  const answersOut = [];

  for (const qid of attempt.questionOrder) {
    const q = qMap.get(qid);
    if (!q) continue;

    maxScore += Number(q.marks || 1);

    const chosenIndex = aMap.has(qid) ? aMap.get(qid) : null;

    let isCorrect = false;
    let marksAwarded = 0;

    if (Number.isInteger(chosenIndex)) {
      // if options were shuffled, chosenIndex refers to displayed index
      // convert to original index via optionOrderMap:
      const order = attempt.optionOrderMap?.get?.(qid) || [0, 1, 2, 3];
      const originalIndex = order[chosenIndex];

      isCorrect = originalIndex === q.correctIndex;
      if (isCorrect) marksAwarded = Number(q.marks || 1);
      else marksAwarded = -Number(q.negativeMarks || 0);
    }

    score += marksAwarded;

    answersOut.push({
      qid,
      chosenIndex,
      isCorrect,
      marksAwarded
    });
  }

  const percentage = maxScore > 0 ? Math.max(0, (score / maxScore) * 100) : 0;

  return { score, maxScore, percentage, answers: answersOut };
}
