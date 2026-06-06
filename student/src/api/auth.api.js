// src/api/auth.api.js
import { api, setAuthTokens, clearAuthTokens, getApiError } from "./axios";

/**
 * ✅ Login
 * Backend expects: { role, identifier, password }
 * (your controller normalizes identifier/email/phone/educatorId)
 */
export async function loginApi({ role, identifier, password }) {
  try {
    const data = await api.post("/auth/login", { role, identifier, password });

    // expected: { accessToken, refreshToken?, user }
    if (data?.accessToken || data?.refreshToken || data?.user) {
      setAuthTokens({
        accessToken: data?.accessToken,
        refreshToken: data?.refreshToken,
        user: data?.user,
      });
    }

    return data;
  } catch (err) {
    throw new Error(getApiError(err, "Login failed"));
  }
}

export function registerStudentApi(payload) {
  return api.post("/auth/register/student", payload);
}

export function registerEducatorApi(payload) {
  return api.post("/auth/register/educator", payload);
}

export async function forgotPasswordApi(payload) {
  try {
    return await api.post("/auth/forgot-password", payload);
  } catch (err) {
    throw new Error(getApiError(err, "Failed to send reset link"));
  }
}

export async function resetPasswordApi(payload) {
  // payload: { token, newPassword } (recommended)
  try {
    return await api.post("/auth/reset-password", payload);
  } catch (err) {
    throw new Error(getApiError(err, "Reset failed"));
  }
}

export async function logoutApi() {
  try {
    await api.post("/auth/logout"); // if you have
  } catch {
    // ignore
  }
  clearAuthTokens();
}
