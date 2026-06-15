import React from "react";
import { NavLink } from "react-router-dom";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function EducatorSidebar({ user, onLogout }) {
  const linkClass = ({ isActive }) =>
    cn(
      "block rounded-2xl px-3 py-2 text-sm border transition-all",
      isActive
        ? "bg-white/10 border-white/20 text-white"
        : "bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/5"
    );

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="mb-4">
        <div className="text-xs text-white/60">Educator Panel</div>
        <div className="text-base font-bold">{user?.fullName || "Educator"}</div>
        <div className="text-[11px] text-white/50">{user?.email || ""}</div>
      </div>

      <nav className="space-y-2">
        <NavLink to="/educator" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/educator/courses" className={linkClass}>
          Courses (Create / Update / Lock)
        </NavLink>
        <NavLink to="/educator/mocktests" className={linkClass}>
          Mock Tests (Create / Assign)
        </NavLink>
        <NavLink to="/educator/activities" className={linkClass}>
          Daily Activities (Upload)
        </NavLink>
        <NavLink to="/educator/leave" className={linkClass}>
          Leave Application
        </NavLink>
      </nav>

      <button
        onClick={onLogout}
        className="mt-4 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15"
      >
        Logout
      </button>
    </aside>
  );
}
