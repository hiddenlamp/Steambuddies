import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (Array.isArray(roles) && roles.length > 0) {
    if (!roles.includes(user.role)) {
      // logged in but not allowed
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}
