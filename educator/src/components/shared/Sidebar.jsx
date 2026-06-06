// src/components/shared/Sidebar.jsx
// Generic shared Sidebar — used by layouts that need a left-panel nav

import React, { useState } from "react";

/**
 * Sidebar
 *
 * Props:
 *   links       {Array}    — [{ path, label, icon }]
 *   logo        {node}     — Logo/brand element
 *   footer      {node}     — Footer slot (e.g. user avatar)
 *   collapsed   {bool}     — Controlled collapse state
 *   onCollapse  {function} — Toggle callback
 */
export default function Sidebar({ links = [], logo, footer, collapsed = false, onCollapse }) {
  const [active, setActive] = useState(window.location.pathname);

  const width = collapsed ? 64 : 240;

  return (
    <aside
      style={{
        width,
        minHeight: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        transition: "width var(--transition-base)",
        overflow: "hidden",
        position: "sticky",
        top: 0,
        zIndex: "var(--z-nav)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Logo + Collapse Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "var(--space-md)",
          borderBottom: "1px solid var(--border-color)",
          minHeight: 64,
        }}
      >
        {!collapsed && logo && (
          <div style={{ fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
            {logo}
          </div>
        )}
        {onCollapse && (
          <button
            onClick={onCollapse}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 18,
              padding: 4,
              borderRadius: "var(--border-radius-sm)",
              transition: "background var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {collapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: "var(--space-sm) 0", overflowY: "auto" }}>
        {links.map((link) => {
          const isActive = active === link.path;
          return (
            <a
              key={link.path}
              href={link.path}
              onClick={() => setActive(link.path)}
              title={collapsed ? link.label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: collapsed ? "var(--space-sm)" : "var(--space-sm) var(--space-md)",
                justifyContent: collapsed ? "center" : "flex-start",
                margin: "2px var(--space-sm)",
                borderRadius: "var(--border-radius-sm)",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
                fontSize: "var(--text-sm)",
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                background: isActive ? "rgba(108,99,255,0.10)" : "transparent",
                transition: "background var(--transition-fast), color var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--bg-surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {link.icon && <span style={{ fontSize: 18, lineHeight: 1 }}>{link.icon}</span>}
              {!collapsed && <span>{link.label}</span>}
              {isActive && !collapsed && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                  }}
                />
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer Slot */}
      {footer && (
        <div
          style={{
            padding: "var(--space-md)",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          {footer}
        </div>
      )}
    </aside>
  );
}
