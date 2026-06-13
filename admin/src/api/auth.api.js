import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com";
const API_BASE = String(RAW_BASE).replace(/\/+$/, "");
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // required to send cookies
});

// Interceptor to handle token (if using local storage, otherwise cookies are handled by withCredentials)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("steambuddies_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("steambuddies_token");
      localStorage.removeItem("steambuddies_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const loginAdmin = async (identifier, password) => {
  return api.post("/auth/login", { role: "admin", identifier, password });
};

export const logoutAdmin = () => {
  localStorage.removeItem("steambuddies_token");
  localStorage.removeItem("steambuddies_user");
  window.location.href = "/login";
};

export default api;
