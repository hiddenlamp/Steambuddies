// src/api/axios.js
import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com";
const API_BASE = String(RAW_BASE).replace(/\/+$/, "");

export const TOKEN_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
};

export function setAuthTokens({ accessToken, refreshToken, user } = {}) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.access, String(accessToken));
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.refresh, String(refreshToken));
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem("user");
}

export function getAccessToken() {
  const t = localStorage.getItem(TOKEN_KEYS.access);
  return t ? String(t).trim().replace(/^"+|"+$/g, "") : "";
}

export function getRefreshToken() {
  const t = localStorage.getItem(TOKEN_KEYS.refresh);
  return t ? String(t).trim().replace(/^"+|"+$/g, "") : "";
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 20000,
  withCredentials: true, // refresh cookie/secure flows ke liye ok
  headers: { Accept: "application/json" },
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const cfg = { ...config };

    // ✅ avoid "/api/api/..." if caller mistakenly passes "/api/xxx"
    if (typeof cfg.url === "string") {
      cfg.url = cfg.url.replace(/^\/api(\/|$)/, "/");
    }

    cfg.headers = cfg.headers || {};

    // ✅ attach access token
    const token = getAccessToken();
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
      cfg.headers["x-access-token"] = token; // optional compatibility
    }

    // ✅ no-cache
    cfg.headers["Cache-Control"] = "no-cache";
    cfg.headers.Pragma = "no-cache";

    // ✅ content-type
    const isFormData =
      typeof FormData !== "undefined" && cfg.data instanceof FormData;

    if (isFormData) {
      delete cfg.headers["Content-Type"];
      delete cfg.headers["content-type"];
    } else {
      if (cfg.data != null && !cfg.headers["Content-Type"]) {
        cfg.headers["Content-Type"] = "application/json";
      }
    }

    return cfg;
  },
  (err) => Promise.reject(err)
);

/* ================= REFRESH HANDLING ================= */
let isRefreshing = false;
let queue = [];

function flushQueue(error, token) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  // ✅ use raw axios to avoid interceptor recursion
  const res = await axios.post(
    `${API_BASE}/api/auth/refresh`,
    { refreshToken },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      timeout: 20000,
    }
  );

  const newAccess = res?.data?.accessToken;
  if (!newAccess) throw new Error("Refresh failed: no accessToken");

  setAuthTokens({
    accessToken: newAccess,
    refreshToken: res?.data?.refreshToken || refreshToken,
  });

  return String(newAccess);
}

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response.data, // ✅ always returns payload
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // network / CORS / server down
    if (!original || !status) return Promise.reject(error);

    const isRefreshCall =
      typeof original.url === "string" && original.url.includes("/auth/refresh");
    const isLoginCall =
      typeof original.url === "string" && original.url.includes("/auth/login");

    if (status === 401 && !original._retry && !isRefreshCall && !isLoginCall) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          original.headers["x-access-token"] = token;
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        flushQueue(null, newToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        original.headers["x-access-token"] = newToken;

        return api(original);
      } catch (err) {
        flushQueue(err, null);
        clearAuthTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ================= ERROR HELPER ================= */
export function getApiError(err, fallback = "Something went wrong") {
  // NOTE: our api returns payload, but errors still keep error.response
  if (!err?.response) return err?.message || "Network error. Backend not reachable.";
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.msg ||
    fallback
  );
}
