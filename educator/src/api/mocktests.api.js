// src/api/mocktests.api.js
import API from "./auth.api"; // axios instance with baseURL `${BASE}/api`

/**
 * ✅ Backend routes (as per your router):
 * GET    /api/mock-tests
 * POST   /api/mock-tests
 * GET    /api/mock-tests/:id
 * PATCH  /api/mock-tests/:id
 * POST   /api/mock-tests/:id/publish
 *
 * POST   /api/mock-tests/:id/generate-questions
 * POST   /api/mock-tests/:id/questions/append
 *
 * GET    /api/mock-tests/:id/monitor
 * GET    /api/mock-tests/:id/leaderboard
 * POST   /api/mock-tests/:id/leaderboard/publish
 */

// ---------------- helpers ----------------
const base = "/mock-tests";
const ensureId = (id) => {
  const v = String(id || "").trim();
  if (!v) throw new Error("MockTest id is required");
  return v;
};

// ---------------- APIs ----------------
export const listEducatorMockTestsApi = (params = {}) =>
  API.get(base, { params });

export const getMockTestApi = (id) =>
  API.get(`${base}/${ensureId(id)}`);

export const createMockTestApi = (payload) =>
  API.post(base, payload);

export const updateMockTestApi = (id, payload) =>
  API.patch(`${base}/${ensureId(id)}`, payload);

export const publishMockTestApi = (id) =>
  API.post(`${base}/${ensureId(id)}/publish`);

export const generateQuestionsApi = (id, payload) =>
  API.post(`${base}/${ensureId(id)}/generate-questions`, payload);

export const appendQuestionsApi = (id, payload) =>
  API.post(`${base}/${ensureId(id)}/questions/append`, payload);

export const monitorMockTestApi = (id) =>
  API.get(`${base}/${ensureId(id)}/monitor`);

export const getLeaderboardForEducatorApi = (id) =>
  API.get(`${base}/${ensureId(id)}/leaderboard`);

export const publishLeaderboardApi = (id) =>
  API.post(`${base}/${ensureId(id)}/leaderboard/publish`);
