// src/controllers/challenges.controller.js
const Challenge = require("../models/Challenge");
const ChallengeAttempt = require("../models/ChallengeAttempt");
const mongoose = require("mongoose");

// Educator: Create a new challenge
exports.createChallenge = async (req, res) => {
  try {
    const { question, options, correctOptionIndex, points, theme, targetSchools } = req.body;
    const newChallenge = await Challenge.create({
      educatorId: req.user.id,
      question,
      options,
      correctOptionIndex,
      points: points || 40,
      theme: theme || "cyan",
      activeDate: new Date(), // Makes it active for today
      targetSchools: Array.isArray(targetSchools) ? targetSchools : []
    });

    const Notification = require("../models/Notification");
    await Notification.create({
      recipient: null, // Global
      title: { en: "New Daily Challenge!" },
      message: { en: `A new daily challenge has been posted. Try it out now!` },
      type: "system",
      relatedId: newChallenge._id,
      sender: req.user.id
    });
    const io = req.app.get("io");
    if (io) io.emit("new_notification");

    res.status(201).json({ ok: true, challenge: newChallenge });
  } catch (err) {
    console.error("Create challenge error:", err);
    res.status(500).json({ ok: false, message: "Failed to create challenge" });
  }
};

// Educator: Get challenges they created
exports.getMyChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ educatorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ ok: true, challenges });
  } catch (err) {
    console.error("Get my challenges error:", err);
    res.status(500).json({ ok: false, message: "Failed to get challenges" });
  }
};

// Student: Get today's challenges and check attempt status
exports.getTodayChallenges = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const studentSchool = req.user.school || "";

    const challenges = await Challenge.find({
      activeDate: { $gte: today, $lt: tomorrow },
      $or: [
        { targetSchools: { $exists: false } },
        { targetSchools: { $size: 0 } },
        { targetSchools: studentSchool }
      ]
    }).populate("educatorId", "fullName").lean();

    // Check if the current student has attempted them
    const challengeIds = challenges.map(c => c._id);
    const attempts = await ChallengeAttempt.find({
      studentId: req.user.id,
      challengeId: { $in: challengeIds }
    }).lean();

    const attemptMap = {};
    attempts.forEach(a => {
      attemptMap[String(a.challengeId)] = a;
    });

    const result = challenges.map(c => {
      const attempt = attemptMap[String(c._id)];
      return {
        ...c,
        hasAttempted: !!attempt,
        // Only return these details if the user has ALREADY attempted it today!
        selectedOpt: attempt ? attempt.selectedOptionIndex : undefined,
        correctOptIndex: attempt ? c.correctOptionIndex : undefined,
        isCorrect: attempt ? attempt.isCorrect : undefined,
        // Hide correct option from students before they answer
        correctOptionIndex: undefined 
      };
    });

    res.status(200).json({ ok: true, challenges: result });
  } catch (err) {
    console.error("Get today challenges error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch challenges" });
  }
};

// Student: Attempt a challenge
exports.attemptChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedOptionIndex } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ ok: false, message: "Challenge not found" });
    }

    const existingAttempt = await ChallengeAttempt.findOne({
      studentId: req.user.id,
      challengeId: id
    });

    if (existingAttempt) {
      return res.status(400).json({ ok: false, message: "Already attempted this challenge" });
    }

    const isCorrect = (selectedOptionIndex === challenge.correctOptionIndex);
    const awardedPoints = isCorrect ? challenge.points : 0;

    const attempt = await ChallengeAttempt.create({
      studentId: req.user.id,
      challengeId: id,
      selectedOptionIndex,
      isCorrect,
      awardedPoints
    });

    res.status(200).json({ 
      ok: true, 
      isCorrect, 
      correctOptionIndex: challenge.correctOptionIndex,
      awardedPoints 
    });
  } catch (err) {
    console.error("Attempt challenge error:", err);
    res.status(500).json({ ok: false, message: "Failed to attempt challenge" });
  }
};

// Educator: Get analytics for a specific challenge
exports.getChallengeStats = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);
    if (!challenge) return res.status(404).json({ ok: false, message: "Challenge not found" });

    // Verify educator owns the challenge
    if (String(challenge.educatorId) !== req.user.id) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const attempts = await ChallengeAttempt.find({ challengeId: id })
      .populate("studentId", "name email fullName avatar")
      .sort({ createdAt: -1 });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.isCorrect).length;

    res.status(200).json({
      ok: true,
      stats: {
        totalAttempts,
        correctAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      },
      attempts
    });
  } catch (err) {
    console.error("Get challenge stats error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch stats" });
  }
};

// Educator: Delete a challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ ok: false, message: "Challenge not found" });
    }

    if (String(challenge.educatorId) !== req.user.id) {
      return res.status(403).json({ ok: false, message: "Unauthorized to delete this challenge" });
    }

    await Challenge.findByIdAndDelete(id);
    // Optionally delete all attempts for this challenge to clean up
    await ChallengeAttempt.deleteMany({ challengeId: id });

    res.status(200).json({ ok: true, message: "Challenge deleted successfully" });
  } catch (err) {
    console.error("Delete challenge error:", err);
    res.status(500).json({ ok: false, message: "Failed to delete challenge" });
  }
};
