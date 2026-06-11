import { useContext, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

const cn = (...s) => s.filter(Boolean).join(" ");

export default function Navbar() {
  const { theme, setTheme } = useContext(ThemeContext);
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const firstLetter = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const name = u?.fullName || u?.name || "U";
      return String(name).trim()?.[0]?.toUpperCase() || "U";
    } catch {
      return "U";
    }
  }, []);

  // close mobile menu on route change
  useMemo(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkBase =
    "relative px-3 py-2 rounded-xl text-[14px] font-semibold transition";

  const linkClass = ({ isActive }) =>
    cn(
      linkBase,
      "text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
      isActive &&
        "text-sky-700 dark:text-sky-200 bg-sky-50 dark:bg-sky-400/10 ring-1 ring-sky-200 dark:ring-sky-300/20"
    );

  return (
    <nav className="w-full sticky top-0 z-40">
      <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur shadow-md dark:shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* LEFT: LOGO */}
          <button
            type="button"
            onClick={() => nav("/home")}
            className="text-xl sm:text-2xl font-extrabold text-sky-500 hover:text-sky-600 transition"
          >
            HiddenLamp
          </button>

          {/* CENTER: NAV LINKS (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/home" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/courses" className={linkClass}>
              Courses
            </NavLink>
            <NavLink to="/tests" className={linkClass}>
              Mock Tests
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <NotificationBell language="en" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:scale-110 transition-transform"
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Profile Avatar */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold hover:scale-105 transition-transform"
              onClick={() => nav("/profile")}
              aria-label="Open profile"
              title="Profile"
            >
              {firstLetter}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setOpen((p) => !p)}
              className="md:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center"
              aria-label="Open menu"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="md:hidden px-4 pb-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex flex-col gap-1">
              <NavLink to="/home" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/courses" className={linkClass}>
                Courses
              </NavLink>
              <NavLink to="/tests" className={linkClass}>
                Mock Tests
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
