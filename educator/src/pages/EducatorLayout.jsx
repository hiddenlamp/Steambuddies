// src/pages/educator/EducatorLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  Sparkles,
  Search,
  Plus,
  Video,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  ArrowLeft,
  FolderKanban,
  FileText,
  GraduationCap,
  StickyNote,
  School,
  Target,
  MessageCircle
} from "lucide-react";
import { API_BASE_URL } from "../utils/data";
import NotificationBell from "../components/shared/NotificationBell";

const cn = (...s) => s.filter(Boolean).join(" ");

function safeUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "E";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function meta(pathname) {
  if (pathname === "/educator") return { title: "Dashboard", sub: "Overview, quick stats & shortcuts." };
  if (pathname.startsWith("/educator/courses")) return { title: "Courses", sub: "Create, update, publish courses & lessons." };
  if (pathname.startsWith("/educator/school-courses")) return { title: "School Courses", sub: "Manage active courses class-wise (student Home)." };

  // ✅ IMPORTANT: match App.jsx -> /educator/mock-tests
  if (pathname.startsWith("/educator/mock-tests")) return { title: "Mock Tests", sub: "Build tests, schedule, monitor & leaderboard." };

  if (pathname.startsWith("/educator/projects")) return { title: "Projects", sub: "Upload projects for students with briefs & files." };
  if (pathname.startsWith("/educator/manuals")) return { title: "Manuals", sub: "Upload manuals / PDFs / guides for learners." };
  if (pathname.startsWith("/educator/syllabus")) return { title: "Syllabus", sub: "Upload syllabus docs and yearly planning." };
  if (pathname.startsWith("/educator/notes")) return { title: "Notes", sub: "Upload class notes, worksheets & handouts." };
  if (pathname.startsWith("/educator/challenges")) return { title: "Challenges", sub: "Post daily MCQ challenges." };
  if (pathname.startsWith("/educator/reels")) return { title: "STEAM Shorts", sub: "Manage short video reels." };
  if (pathname.startsWith("/educator/doubts")) return { title: "Doubts Console", sub: "Resolve student doubts and chat." };
  return { title: "Educator", sub: "Manage your teaching workspace." };
}

/** 3D tilt wrapper */
function TiltCard({ className, children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(y, { stiffness: 150, damping: 20 });
  const ry = useSpring(x, { stiffness: 150, damping: 20 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    x.set((px - 0.5) * 8);
    y.set((0.5 - py) * 8);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={cn(
        "relative rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl",
        "shadow-[0_30px_120px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.75),transparent_60%)]" />
      {children}
    </motion.div>
  );
}

function PillNav({ icon: Icon, label, badge, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full group rounded-2xl px-3 py-3 transition border",
        active
          ? "bg-white/10 border-white/15 shadow-[0_14px_45px_rgba(0,0,0,0.35)]"
          : "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 hover:border-white/15"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "size-10 rounded-2xl grid place-items-center border",
            active
              ? "bg-gradient-to-br from-sky-400/25 via-indigo-400/20 to-fuchsia-400/20 border-white/15"
              : "bg-white/5 border-white/10 group-hover:border-white/15"
          )}
        >
          <Icon className={cn("h-5 w-5", active ? "text-white" : "text-white/80")} />
        </span>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-[13px] font-black", active ? "text-white" : "text-white/85")}>{label}</p>
            {badge != null && (
              <span className="text-[11px] font-extrabold px-2 py-[2px] rounded-full bg-white/10 border border-white/10 text-white/80">
                {badge}
              </span>
            )}
          </div>

          <div className="mt-1 h-[2px] w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                active
                  ? "w-[72%] bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300"
                  : "w-[38%] bg-white/15 group-hover:w-[55%]"
              )}
            />
          </div>
        </div>

        <ChevronRight className={cn("h-4 w-4 transition", active ? "text-white/80" : "text-white/35 group-hover:text-white/55")} />
      </div>
    </button>
  );
}



function Sidebar({ user, counts, activeKey, onNav, onLogout }) {
  const name = user?.name || user?.fullName || "Educator";
  const role = (user?.role || "educator").toUpperCase();

  return (
    <div className="sticky top-4 space-y-3">
      <TiltCard className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="size-12 rounded-2xl grid place-items-center border border-white/12 bg-gradient-to-br from-sky-400/25 via-indigo-400/18 to-fuchsia-400/20">
                <span className="text-sm font-black">{initials(name)}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(0,0,0,0.55)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-black">{name}</p>
              <p className="text-[11px] text-white/65 font-extrabold tracking-[0.18em]">{role}</p>
            </div>
          </div>

          <NotificationBell language="en" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["Courses", counts?.courses ?? 0],
            ["School", counts?.schoolCourses ?? 0],
            ["Tests", counts?.mocktests ?? 0],
            ["Projects", counts?.projects ?? 0],
            ["Manuals", counts?.manuals ?? 0],
            ["Syllabus", counts?.syllabus ?? 0],
            ["Notes", counts?.notes ?? 0],
            ["Challenges", counts?.challenges ?? 0],
            ["STEAM Shorts", counts?.reels ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-white/55 font-extrabold tracking-[0.16em] uppercase">{label}</p>
              <p className="mt-1 text-[16px] font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white/80" />
            <p className="text-[12px] font-black text-white/90">Educator Console</p>
          </div>
          <p className="mt-1 text-[11px] text-white/65 font-semibold leading-relaxed">
            Courses, School Active Courses, Mock Tests & Resources.
          </p>
        </div>
      </TiltCard>

      <TiltCard className="p-3">
        <div className="px-2 pb-2">
          <p className="text-[10px] text-white/55 font-extrabold tracking-[0.18em] uppercase">Navigation</p>
        </div>

        <div className="space-y-2">
          <PillNav icon={LayoutDashboard} label="Dashboard" badge="PRO" active={activeKey === "/educator"} onClick={() => onNav("/educator")} />
          <PillNav icon={BookOpen} label="Courses" badge={counts?.courses ?? 0} active={activeKey === "/educator/courses"} onClick={() => onNav("/educator/courses")} />
          <PillNav icon={School} label="School Courses" badge={counts?.schoolCourses ?? "LIVE"} active={activeKey === "/educator/school-courses"} onClick={() => onNav("/educator/school-courses")} />

          {/* ✅ IMPORTANT: /educator/mock-tests */}
          <PillNav icon={ClipboardList} label="Mock Tests" badge={counts?.mocktests ?? 0} active={activeKey === "/educator/mock-tests"} onClick={() => onNav("/educator/mock-tests")} />

          <PillNav icon={FileText} label="Daily Reports" badge="NEW" active={activeKey === "/educator/reports/new"} onClick={() => onNav("/educator/reports/new")} />

          <PillNav icon={FolderKanban} label="Projects" badge={counts?.projects ?? 0} active={activeKey === "/educator/projects"} onClick={() => onNav("/educator/projects")} />
          <PillNav icon={FileText} label="Manuals" badge={counts?.manuals ?? 0} active={activeKey === "/educator/manuals"} onClick={() => onNav("/educator/manuals")} />
          <PillNav icon={GraduationCap} label="Syllabus" badge={counts?.syllabus ?? 0} active={activeKey === "/educator/syllabus"} onClick={() => onNav("/educator/syllabus")} />
          <PillNav icon={StickyNote} label="Notes" badge={counts?.notes ?? 0} active={activeKey === "/educator/notes"} onClick={() => onNav("/educator/notes")} />
          <PillNav icon={Target} label="Challenges" badge={counts?.challenges ?? 0} active={activeKey === "/educator/challenges"} onClick={() => onNav("/educator/challenges")} />
          <PillNav icon={Video} label="STEAM Shorts" badge={counts?.reels ?? 0} active={activeKey === "/educator/reels"} onClick={() => onNav("/educator/reels")} />
          <PillNav icon={MessageCircle} label="Doubt Chat" badge="NEW" active={activeKey === "/educator/doubts"} onClick={() => onNav("/educator/doubts")} />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "mt-3 w-full rounded-2xl px-3 py-3",
            "bg-red-500/10 hover:bg-red-500/16 border border-red-400/20 hover:border-red-300/25 transition",
            "flex items-center justify-center gap-2 text-[13px] font-black"
          )}
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </TiltCard>
    </div>
  );
}

export default function EducatorLayout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const user = useMemo(() => safeUser(), []);

  // ✅ token sync (fix same-tab issues)
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const sync = () => setAccessToken(localStorage.getItem("accessToken") || "");
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) nav("/login");
  }, [accessToken, nav]);

  useEffect(() => setDrawer(false), [pathname]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setAccessToken("");
    nav("/login");
  };

  // ✅ Real API counts
  const [counts, setCounts] = useState({
    courses: 0,
    schoolCourses: 0,
    mocktests: 0,
    projects: 0,
    manuals: 0,
    syllabus: 0,
    notes: 0,
    challenges: 0,
    reels: 0,
  });

  useEffect(() => {
    if (!accessToken) return;
    
    fetch(`${API_BASE_URL}/educator/stats`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.counts) {
        setCounts(data.counts);
      }
    })
    .catch(console.error);
  }, [accessToken]);

  const m = useMemo(() => meta(pathname), [pathname]);

  const activeKey = useMemo(() => {
    if (pathname.startsWith("/educator/courses")) return "/educator/courses";
    if (pathname.startsWith("/educator/school-courses")) return "/educator/school-courses";
    if (pathname.startsWith("/educator/mock-tests")) return "/educator/mock-tests";
    if (pathname.startsWith("/educator/projects")) return "/educator/projects";
    if (pathname.startsWith("/educator/manuals")) return "/educator/manuals";
    if (pathname.startsWith("/educator/syllabus")) return "/educator/syllabus";
    if (pathname.startsWith("/educator/notes")) return "/educator/notes";
    if (pathname.startsWith("/educator/challenges")) return "/educator/challenges";
    if (pathname.startsWith("/educator/reels")) return "/educator/reels";
    if (pathname.startsWith("/educator/doubts")) return "/educator/doubts";
    if (pathname.startsWith("/educator/reports")) return "/educator/reports/new";
    return "/educator";
  }, [pathname]);

  // ✅ Builder routes (hide header cards)
  const isBuilderRoute = useMemo(() => {
    if (pathname.startsWith("/educator/school-courses")) return true;

    if (pathname === "/educator/courses/new") return true;
    if (/^\/educator\/courses\/[^/]+\/edit$/.test(pathname)) return true;

    // ✅ mock tests builder
    if (pathname === "/educator/mock-tests/new") return true;
    if (/^\/educator\/mock-tests\/[^/]+$/.test(pathname)) return true; // manage page
    if (/^\/educator\/mock-tests\/[^/]+\/edit$/.test(pathname)) return true;

    if (pathname === "/educator/projects/new") return true;
    if (/^\/educator\/projects\/[^/]+\/edit$/.test(pathname)) return true;

    if (pathname === "/educator/manuals/new") return true;
    if (/^\/educator\/manuals\/[^/]+\/edit$/.test(pathname)) return true;

    if (pathname === "/educator/syllabus/new") return true;
    if (/^\/educator\/syllabus\/[^/]+\/edit$/.test(pathname)) return true;

    if (pathname === "/educator/notes/new") return true;
    if (/^\/educator\/notes\/[^/]+\/edit$/.test(pathname)) return true;

    if (pathname === "/educator/reports/new") return true;

    if (pathname.startsWith("/educator/challenges")) return true;
    if (pathname.startsWith("/educator/reels")) return true;
    if (pathname.startsWith("/educator/doubts")) return true;

    return false;
  }, [pathname]);

  return (
    <div className="min-h-screen text-white bg-[#05070f] relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_60%_88%,rgba(244,114,182,0.14),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 md:px-4 lg:px-6 py-4">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className={cn(
            "sticky top-3 z-40",
            "rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-xl",
            "shadow-[0_22px_80px_rgba(0,0,0,0.45)]",
            "px-4 py-4 md:px-5 md:py-5"
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                className="lg:hidden rounded-2xl p-2 bg-white/6 border border-white/10 hover:bg-white/10 hover:border-white/15 transition"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-extrabold tracking-[0.22em] text-white/60 uppercase">Educator Studio</p>
                <h1 className="mt-1 text-[18px] md:text-[20px] font-black leading-tight">
                  <span className="text-white">{m.title}</span>{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
                    Console
                  </span>
                </h1>
                <p className="mt-1 text-[12px] text-white/65 font-semibold">{m.sub}</p>
              </div>
            </div>

            {!isBuilderRoute ? (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/55" />
                  <input
                    placeholder="Search courses, activities, tests, resources..."
                    className={cn(
                      "w-full sm:w-[320px] rounded-2xl pl-10 pr-3 py-2.5",
                      "bg-black/25 border border-white/10 focus:border-white/20 outline-none",
                      "text-[13px] font-semibold text-white placeholder:text-white/40 transition-all focus:sm:w-[400px]"
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
                    "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="rounded-2xl px-4 py-2.5 text-[12px] font-semibold text-white/70 border border-white/10 bg-white/[0.04]">
                  Builder mode — fill details & publish
                </div>
              </div>
            )}
          </div>
        </motion.header>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-5">
          <div className="hidden lg:block">
            <Sidebar user={user} counts={counts} activeKey={activeKey} onNav={(to) => nav(to)} onLogout={logout} />
          </div>

          <AnimatePresence>
            {drawer && (
              <>
                <motion.button
                  className="fixed inset-0 z-[80] bg-black/55"
                  onClick={() => setDrawer(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.div
                  initial={{ x: -360 }}
                  animate={{ x: 0 }}
                  exit={{ x: -360 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="fixed left-3 top-3 bottom-3 z-[90] w-[360px] max-w-[92vw]"
                >
                  <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    className="absolute right-0 sm:-right-3 top-0 sm:-top-3 rounded-2xl p-2 bg-white/20 border border-white/20 backdrop-blur-xl z-50 shadow-xl text-white hover:bg-white/30"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="relative h-full overflow-y-auto pb-6 pr-2 custom-scrollbar">
                    <Sidebar user={user} counts={counts} activeKey={activeKey} onNav={(to) => nav(to)} onLogout={logout} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="relative rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] p-3 sm:p-4 md:p-5">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
