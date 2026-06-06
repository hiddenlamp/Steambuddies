import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import * as C from "../controllers/mocktests.student.controller.js";

const r = express.Router();

r.use(requireAuth, requireRole("student"));

r.get("/mock-tests", C.listAvailable);
r.post("/mock-tests/:id/start", C.startAttempt);
r.post("/mock-tests/:id/submit", C.submitAttempt);
r.get("/mock-tests/:id/leaderboard", C.getLeaderboardForStudent);

export default r;
