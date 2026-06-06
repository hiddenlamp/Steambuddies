// src/api/http.js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

function getTokens() {
  const accessToken = localStorage.getItem("accessToken") || "";
  const refreshToken = localStorage.getItem("refreshToken") || "";
  return { accessToken, refreshToken };
}

function setTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  const data = await safeJson(res);
  if (!res.ok) return null;

  // expected: { accessToken, refreshToken? }
  if (data?.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data?.accessToken || null;
}

/**
 * ✅ api(path, options)
 * - auto attaches access token
 * - if 401 -> tries refresh once -> retries request
 */
export async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const { accessToken } = getTokens();

  const headers = {
    ...(options.headers || {}),
    "Content-Type": options.body instanceof FormData ? undefined : "application/json",
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };

  // Remove undefined headers (important for FormData)
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // If unauthorized, attempt refresh once
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...(headers || {}),
        Authorization: `Bearer ${newToken}`,
      };
      const retry = await fetch(url, { ...options, headers: retryHeaders, credentials: "include" });
      const retryData = await safeJson(retry);
      if (!retry.ok) {
        const err = new Error(retryData?.message || "Request failed");
        err.status = retry.status;
        err.data = retryData;
        throw err;
      }
      return retryData;
    }

    // refresh failed -> logout
    clearTokens();
    const data = await safeJson(res);
    const err = new Error(data?.message || "Unauthorized");
    err.status = 401;
    err.data = data;
    throw err;
  }

  const data = await safeJson(res);
  if (!res.ok) {
    const err = new Error(data?.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const authStore = { setTokens, clearTokens };
export const API_BASE_URL = API_BASE;
