// src/components/shared/TestCard.jsx
// Reusable card component for mock tests / quizzes

import React from "react";

/**
 * TestCard — Displays a mock test or quiz card.
 *
 * Props:
 *   title       {string}   — Test title
 *   subject     {string}   — Subject name (e.g. "Physics")
 *   duration    {number}   — Duration in minutes
 *   questions   {number}   — Number of questions
 *   difficulty  {string}   — "beginner" | "intermediate" | "advanced"
 *   onStart     {function} — Callback when "Start" button is clicked
 *   onPreview   {function} — Callback when card is clicked for preview
 */
export default function TestCard({
  title = "Untitled Test",
  subject = "",
  duration = 30,
  questions = 10,
  difficulty = "beginner",
  onStart,
  onPreview,
}) {
  const difficultyColors = {
    beginner:     { bg: "#e8fff1", text: "#1a7f4e", dot: "#43e97b" },
    intermediate: { bg: "#fff8e8", text: "#7f5a1a", dot: "#f7971e" },
    advanced:     { bg: "#ffeaea", text: "#7f1a1a", dot: "#f64f59" },
  };

  const colors = difficultyColors[difficulty] || difficultyColors.beginner;

  return (
    <div
      onClick={onPreview}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--border-radius-md)",
        padding: "var(--space-lg)",
        cursor: onPreview ? "pointer" : "default",
        transition: "transform var(--transition-base), box-shadow var(--transition-base)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-sm)" }}>
        <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)", margin: 0, flex: 1 }}>
          {title}
        </h3>
        {/* Difficulty Badge */}
        <span style={{
          background: colors.bg,
          color: colors.text,
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          padding: "2px 10px",
          borderRadius: 999,
          marginLeft: "var(--space-sm)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          whiteSpace: "nowrap",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot, display: "inline-block" }} />
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      </div>

      {/* Subject */}
      {subject && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: "0 0 var(--space-md) 0" }}>
          {subject}
        </p>
      )}

      {/* Meta Info */}
      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          <span>⏱</span> {duration} min
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          <span>📝</span> {questions} Qs
        </div>
      </div>

      {/* Start Button */}
      {onStart && (
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          style={{
            width: "100%",
            padding: "var(--space-sm) 0",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-sm)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            transition: "opacity var(--transition-fast)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          Start Test →
        </button>
      )}
    </div>
  );
}
