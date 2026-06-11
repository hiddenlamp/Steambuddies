// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";

export const AuthContext = createContext(null);

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com";
const API_BASE = `${String(RAW_BASE).replace(/\/+$/, "")}/api/auth`;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 token helpers
  const getToken = () => localStorage.getItem("token");
  const setToken = (token) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  };

  // 🔄 load current user on refresh
  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Auth error:", err);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 run once on app load
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ✅ login (call after successful backend login)
  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };

  // 🚪 logout
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: loadUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

