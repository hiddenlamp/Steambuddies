// src/routes/challenges.routes.js
const express = require("express");
const router = express.Router();
const challengesController = require("../controllers/challenges.controller");
const { requireAuth } = require("../middleware/auth.middleware");

// Educator routes
router.post("/", requireAuth, challengesController.createChallenge);
router.get("/my-challenges", requireAuth, challengesController.getMyChallenges);

// Student routes
router.get("/today", requireAuth, challengesController.getTodayChallenges);
router.post("/:id/attempt", requireAuth, challengesController.attemptChallenge);

// Educator: Get analytics for a specific challenge
router.get("/:id/stats", requireAuth, challengesController.getChallengeStats);

// Educator: Delete a challenge
router.delete("/:id", requireAuth, challengesController.deleteChallenge);

module.exports = router;
