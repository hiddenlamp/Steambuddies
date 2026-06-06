// src/api/activities.api.js
import { api } from "./axios";

/**
 * =========================
 * STUDENT (Quest)
 * =========================
 */

export function feedActivitiesApi(params = {}) {
  return api.get("/activities/feed", { params });
}

export function likeActivityApi(id) {
  if (!id) throw new Error("likeActivityApi: id is required");
  return api.post(`/activities/${id}/like`);
}

export function seenActivityApi(id) {
  if (!id) throw new Error("seenActivityApi: id is required");
  return api.post(`/activities/${id}/seen`);
}

/**
 * =========================
 * EDUCATOR
 * =========================
 */

export function myActivitiesApi(params = {}) {
  return api.get("/activities/my", { params });
}

/**
 * POST /api/activities
 * - JSON → text
 * - FormData → image/video
 */
export function createActivityApi(data) {
  if (!data) throw new Error("createActivityApi: data is required");
  return api.post("/activities", data);
}

export function deleteActivityApi(id) {
  if (!id) throw new Error("deleteActivityApi: id is required");
  return api.delete(`/activities/${id}`);
}
