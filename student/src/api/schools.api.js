// src/api/schools.api.js
import { api } from "./axios";

// ✅ list schools for dropdown
export const listSchoolsApi = (params) => api.get("/schools", { params });

// Optional helpers (later use)
export const getSchoolApi = (id) => api.get(`/schools/${id}`);
export const createSchoolApi = (payload) => api.post("/schools", payload);
export const updateSchoolApi = (id, payload) => api.put(`/schools/${id}`, payload);
export const deleteSchoolApi = (id) => api.delete(`/schools/${id}`);

export default { listSchoolsApi, getSchoolApi, createSchoolApi, updateSchoolApi, deleteSchoolApi };
