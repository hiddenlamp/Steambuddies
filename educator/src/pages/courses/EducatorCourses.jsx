import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  ArrowLeft,
  Sparkles,
  Layers,
  Languages,
  Star,
  BookOpen,
  ClipboardEdit,
  Save,
  Send,
  Trash,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import {
  listMyCoursesApi,
  deleteCourseApi,
  createCourseApi,
  getMyCourseApi,
  updateCourseApi,
  patchCourseApi,
} from "../../api/courses.api";

import { CATEGORIES, GRADE_GROUPS } from "./courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");
const emptyLS = () => ({ en: "", hi: "" });

/* =========================
   Shared UI helpers (theme-agnostic)
========================= */
function getCat(id) {
  return CATEGORIES?.find?.((x) => x.id === id) || null;
}
function getGrade(id) {
  return GRADE_GROUPS?.find?.((x) => x.id === id) || null;
}
function formatDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString();
  } catch {
    return "-";
  }
}
function toUpper(x) {
  return String(x || "").toUpperCase();
}

function useEducatorTheme() {
  // If you already have ThemeContext, replace this with your context hook.
  // Keeping it stable with your existing dark educator pages.
  const theme = "dark";
  const pageBase = theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const glass =
    theme === "dark"
      ? "border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_28px_70px_-28px_rgba(0,0,0,.8)]"
      : "border-white/60 bg-white/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.65),0_24px_60px_-28px_rgba(99,102,241,.35)]";
  const glassSoft =
    theme === "dark" ? "border-white/10 bg-white/[0.03] backdrop-blur-xl" : "border-white/60 bg-white/60 backdrop-blur-xl";
  const muted = theme === "dark" ? "text-white/70" : "text-slate-600";
  const muted2 = theme === "dark" ? "text-white/55" : "text-slate-500";
  return { theme, pageBase, glass, glassSoft, muted, muted2 };
}

function AccentOrbs({ accent = "from-sky-500 via-indigo-500 to-fuchsia-500" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute -top-28 -left-24 h-72 w-72 rounded-full bg-gradient-to-r blur-3xl opacity-35", accent)} />
      <div className={cn("absolute top-20 -right-24 h-80 w-80 rounded-full bg-gradient-to-r blur-3xl opacity-35", accent)} />
      <div className={cn("absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-r blur-3xl opacity-25", accent)} />
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.08),transparent_55%)]" />
    </div>
  );
}

function Toast({ toast, onClose, glassSoft }) {
  if (!toast?.msg) return null;
  const ok = toast.type === "success";
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "rounded-2xl border p-3 text-[12px] font-semibold flex items-start justify-between gap-3",
          ok ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-100" : "border-red-400/25 bg-red-500/10 text-red-200"
        )}
      >
        <div className="flex items-start gap-2">
          {ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <X className="h-4 w-4 mt-0.5" />}
          <div>{toast.msg}</div>
        </div>

        <button
          onClick={onClose}
          className={cn("rounded-xl border px-2 py-1 transition", glassSoft, "hover:bg-white/10")}
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, hint, children, muted2 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-white/70">{label}</p>
        {hint ? <p className={cn("text-[11px] font-semibold", muted2)}>{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold text-white outline-none",
        "focus:border-white/20 focus:bg-black/30",
        className
      )}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold text-white outline-none",
        "focus:border-white/20 focus:bg-black/30",
        className
      )}
    />
  );
}

function Select({ className = "", ...props }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold text-white outline-none",
        "focus:border-white/20 focus:bg-black/30",
        className
      )}
    />
  );
}

function PrimaryBtn({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={cn(
        "rounded-2xl px-4 py-2.5 text-[13px] font-black",
        "bg-white text-slate-900 hover:bg-white/90 transition",
        "flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

function GhostBtn({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={cn(
        "rounded-2xl px-4 py-2.5 text-[13px] font-black",
        "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition",
        "flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

function SuccessBtn({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={cn(
        "rounded-2xl px-4 py-2.5 text-[13px] font-black",
        "bg-emerald-400/12 hover:bg-emerald-400/18 border border-emerald-300/25 hover:border-emerald-300/35 transition",
        "flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

function DangerBtn({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={cn(
        "rounded-2xl px-4 py-2.5 text-[13px] font-black",
        "bg-red-500/10 hover:bg-red-500/16 border border-red-400/20 transition",
        "flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/* =========================
   1) EducatorCourses.jsx (History/List)
========================= */
export default function EducatorCourses() {
  const nav = useNavigate();
  const { pageBase, glass, glassSoft, muted, muted2 } = useEducatorTheme();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState("");

  const fetchMine = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await listMyCoursesApi();
      const data = res?.data?.data ?? res?.data?.courses ?? res?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((c) => {
      const id = String(c?._id || c?.id || "").toLowerCase();
      const title = String(c?.title?.en ?? c?.title?.hi ?? c?.title ?? "").toLowerCase();
      const cat = String(c?.category || "").toLowerCase();
      const status = String(c?.status || "").toLowerCase();
      return id.includes(t) || title.includes(t) || cat.includes(t) || status.includes(t);
    });
  }, [list, q]);

  const onDelete = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      await deleteCourseApi(id);
      setToast({ type: "success", msg: "✅ Course deleted." });
      setList((prev) => prev.filter((x) => (x._id || x.id) !== id));
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.message || e?.message || "Delete failed" });
    }
  };

  return (
    <div className={cn("min-h-screen", pageBase)}>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-8">
        {/* HERO */}
        <div className={cn("relative overflow-hidden rounded-3xl border p-6 md:p-10", glass)}>
          <AccentOrbs accent="from-sky-500 via-indigo-500 to-fuchsia-500" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.22em] text-white/60 uppercase">
                Educator • Courses
              </p>
              <h2 className="mt-2 text-[22px] md:text-[28px] font-black tracking-tight">
                My Courses (History)
              </h2>
              <p className={cn("mt-2 text-[13px] font-semibold", muted)}>
                Create, edit, publish, delete — sab yahin se. Student UI me automatically show hoga.
              </p>

              <div className={cn("mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", glassSoft)}>
                <Sparkles className="h-4 w-4" />
                <span className={cn("font-semibold", muted)}>
                  Total: <span className="text-white">{list.length}</span> • Showing:{" "}
                  <span className="text-white">{filtered.length}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <SuccessBtn onClick={() => nav("/educator/courses/new")}>
                <Plus className="h-4 w-4" /> New Course
              </SuccessBtn>
              <GhostBtn onClick={fetchMine}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </GhostBtn>
            </div>
          </div>
        </div>

        {/* Toast + Error */}
        <div className="mt-4 space-y-3">
          <Toast toast={toast} onClose={() => setToast(null)} glassSoft={glassSoft} />
          {err ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] text-red-200 font-semibold">
              {err}
            </div>
          ) : null}
        </div>

        {/* Search */}
        <div className={cn("mt-5 rounded-3xl border p-4", glass)}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title / category / status / id…"
              className="pl-10 py-3"
            />
          </div>
          <div className={cn("mt-2 text-xs font-semibold", muted2)}>
            Tip: Search “published” to quickly filter published courses.
          </div>
        </div>

        {/* List */}
        <div className="mt-5">
          {loading ? (
            <div className={cn("rounded-3xl border p-6 font-semibold", glass, muted)}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={cn("rounded-3xl border p-6 font-semibold", glass, muted)}>
              No courses found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const id = c._id || c.id;
                const title = c?.title?.en ?? c?.title?.hi ?? c?.title ?? "Untitled";
                const status = toUpper(c?.status || "draft");
                const videosCount = Array.isArray(c?.videos) ? c.videos.length : 0;

                const cat = getCat(c.category);
                const accent = cat?.accent || "from-sky-500 via-indigo-500 to-fuchsia-500";
                const catLabel = cat?.name?.en ?? c.category ?? "Course";
                const gradeLabel = getGrade(c.gradeGroup)?.label?.en ?? c.gradeGroup ?? "Group";

                return (
                  <motion.div
                    key={id}
                    whileHover={{ y: -4 }}
                    className={cn("group relative overflow-hidden rounded-3xl border p-4", glass)}
                  >
                    <div className={cn("absolute -top-14 -right-14 h-40 w-40 rounded-full bg-gradient-to-r blur-3xl opacity-25", accent)} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-r", accent)} />
                            <div className="text-lg font-black truncate">{title}</div>
                          </div>

                          <div className={cn("mt-1 text-xs font-semibold", muted2)}>
                            {catLabel} • {gradeLabel} •{" "}
                            <span className={cn(status === "PUBLISHED" ? "text-emerald-200" : "text-amber-200")}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => nav(`/educator/courses/${id}/edit`)}
                            className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-white/80" />
                          </button>

                          <button
                            onClick={() => onDelete(id)}
                            className="rounded-2xl px-3 py-2 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-200" />
                          </button>
                        </div>
                      </div>

                      <div className={cn("mt-3 text-sm", muted, "line-clamp-3")}>
                        {c?.description?.en ?? c?.description?.hi ?? "—"}
                      </div>

                      <div className={cn("mt-4 grid gap-2", glassSoft, "rounded-2xl border p-3")}>
                        <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                          <span className="inline-flex items-center gap-2">
                            <Layers className="h-4 w-4" /> Videos: {videosCount}
                          </span>
                          <span>{c?.updatedAt ? formatDate(c.updatedAt) : "-"}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold text-white/60">
                          <span className="inline-flex items-center gap-2">
                            <Languages className="h-4 w-4" /> {(c?.meta?.language || ["en", "hi"]).join(", ").toUpperCase()}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Star className="h-4 w-4" /> {Number(c?.meta?.rating ?? 4.7).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => nav(`/courses/${id}`)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black",
                            "bg-white/8 hover:bg-white/12 border-white/10 transition"
                          )}
                          title="Open as student"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Preview (Student)
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}