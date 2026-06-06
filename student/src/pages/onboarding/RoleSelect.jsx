// src/student/pages/onboarding/RoleSelect.jsx
// Onboarding screen — Student chooses their role (Student or Educator)

import React from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    id: "student",
    emoji: "🎓",
    title: "I'm a Student",
    description: "Explore courses, take tests, and level up your STEAM skills.",
    gradient: "linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)",
  },
  {
    id: "educator",
    emoji: "📚",
    title: "I'm an Educator",
    description: "Create content, manage classes, and inspire the next generation.",
    gradient: "linear-gradient(135deg, #f64f59 0%, #f7971e 100%)",
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  function handleSelect(roleId) {
    localStorage.setItem("selectedRole", roleId);
    if (roleId === "educator") {
      navigate("/educator");
    } else {
      navigate("/login");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "var(--space-xl)",
        gap: "var(--space-lg)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
        <h1
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Who are you?
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-sm)", fontSize: "var(--text-base)" }}>
          Choose your role to get started
        </p>
      </div>

      {/* Role Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          width: "100%",
          maxWidth: 400,
        }}
      >
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
              padding: "var(--space-lg)",
              borderRadius: "var(--border-radius-lg)",
              border: "2px solid transparent",
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
              textAlign: "left",
              transition: "transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {/* Emoji Icon */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "var(--border-radius-md)",
                background: role.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              {role.emoji}
            </div>

            {/* Text */}
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--text-primary)" }}>
                {role.title}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                {role.description}
              </p>
            </div>

            <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
