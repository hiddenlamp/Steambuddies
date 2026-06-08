import axios from "axios";

// Automatically use the correct backend URL
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com/api";

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

export const loginAdmin = async (identifier, password) => {
  return api.post("/auth/login", { role: "admin", identifier, password });
};

export const logoutAdmin = () => {
  localStorage.removeItem("steambuddies_token");
  localStorage.removeItem("steambuddies_user");
  window.location.href = "/login";
};

export default api;
