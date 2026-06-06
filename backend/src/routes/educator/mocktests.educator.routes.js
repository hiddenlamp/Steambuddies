// src/routes/mocktests.educator.routes.js (CommonJS)
const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/educator/mocktests.educator.controller");

// ✅ aapke project me auth middleware ka exact filename yahi hai to ok:
const { requireAuth } = require("../../middleware/auth.middleware");

// ✅ FIX: aapke paas src/middleware/rbac.js hai
const { requireRole } = require("../../middleware/rbac");

// ========== Mock Tests (Educator) ==========

// list my tests
router.get("/mock-tests", requireAuth, requireRole("educator"), ctrl.listMyTests);

// create draft test
router.post("/mock-tests", requireAuth, requireRole("educator"), ctrl.createTest);

// get one
router.get("/mock-tests/:id", requireAuth, requireRole("educator"), ctrl.getTest);

// update meta
router.patch("/mock-tests/:id", requireAuth, requireRole("educator"), ctrl.updateTest);

// publish
router.post("/mock-tests/:id/publish", requireAuth, requireRole("educator"), ctrl.publishTest);

// generate questions (OpenAI/fallback)
router.post("/mock-tests/:id/generate-questions", requireAuth, requireRole("educator"), ctrl.generateQuestions);

// append questions into test
router.post("/mock-tests/:id/questions/append", requireAuth, requireRole("educator"), ctrl.appendQuestions);

module.exports = router;
