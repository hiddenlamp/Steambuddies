// src/api/courses.api.js
import axios from "axios";

// ✅ Keep env as base host only, e.g. http://localhost:5000
const RAW = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BASE = String(RAW).replace(/\/+$/, "");

// ✅ Single axios instance for all course APIs
const API = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: false, // JWT in localStorage
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

/**
 * ✅ IMPORTANT: Set token both in localStorage AND axios default header.
 * This guarantees token is present immediately after login without waiting for interceptor.
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("accessToken");
    delete API.defaults.headers.common.Authorization;
  }
};

// ✅ On app load: if token exists, attach it
const bootToken = localStorage.getItem("accessToken");
if (bootToken) {
  API.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

// ✅ Optional: interceptor as backup
API.interceptors.request.use(
  (config) => {
    if (!config.headers?.Authorization) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Global 401 handler
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // optional: setAccessToken(null);
    }
    return Promise.reject(error);
  }
);

/* ========= STUDENT (PUBLIC) ========= */
export const listCoursesApi = (params) => API.get("/courses/public", { params });
export const getCoursePublicApi = (id) => API.get(`/courses/public/${id}`);

/* ========= ✅ STUDENT (ASSIGNED ONLY) ========= */
export const listMyAssignedCoursesApi = (params) =>
  API.get("/student/my-active-courses", { params });

/* ========= EDUCATOR ========= */
export const listMyCoursesApi = () => API.get("/courses/mine");
export const getMyCourseApi = (id) => API.get(`/courses/mine/${id}`);

export const createCourseApi = (payload) => API.post("/courses", payload);
export const updateCourseApi = (id, payload) => API.put(`/courses/${id}`, payload);
export const deleteCourseApi = (id) => API.delete(`/courses/${id}`);
export const patchCourseApi = (id, payload) => API.patch(`/courses/${id}`, payload);

export default API;
