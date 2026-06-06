// src/components/RequireAuth.jsx
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  const loc = useLocation();

  if (loading) return null; // or loader
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export function RequireRole({ roles = [], children }) {
  const { user, loading } = useContext(AuthContext);
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  const r = String(user?.role || "").toLowerCase();
  const ok = roles.map((x) => String(x).toLowerCase()).includes(r);

  if (!ok) return <Navigate to="/home" replace />;
  return children;
}
