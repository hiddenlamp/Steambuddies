// src/pages/educator/notes/EducatorNotes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  UploadCloud,
  Trash2,
  FileText,
  Search,
  Plus,
  X,
  Filter,
  Download,
  Tag,
  Clock,
  ShieldCheck,
  BookOpen,
  Users,
  RefreshCcw,
} from "lucide-react";

const cn = (...s) => s.filter(Boolean).join(" ");

// ✅ SAME env key as courses.api.js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

const spring = { type: "spring", stiffness: 320, damping: 24 };

function getToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function safeUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initials(name = "") {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0] || "E";
  const b = p[1]?.[0] || "";
  return (a + b).toUpperCase();
}

// ✅ API helper (JSON endpoints)
async function api(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { message: txt };
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function TiltCard({ className, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        "relative rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl",
        "shadow-[0_26px_90px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.75),transparent_60%)]" />
      {!reduce && (
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full blur-3xl opacity-15 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.85),transparent_60%)]" />
      )}
      {children}
    </motion.div>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2">
      <span className="size-9 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
        <Icon className="h-4 w-4 text-white/80" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-white/55 font-extrabold tracking-[0.18em] uppercase">{label}</p>
        <p className="text-[14px] font-black text-white/90">{value}</p>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition whitespace-nowrap",
        active
          ? "bg-white/12 border-white/18 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
          : "bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.07] hover:border-white/15"
      )}
    >
      {children}
    </button>
  );
}

function Dropzone({ file, onPick }) {
  return (
    <label className="group block cursor-pointer">
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-black/20 p-4",
          "hover:bg-black/25 hover:border-white/15 transition",
          "flex items-center justify-between gap-3"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-12 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
            <UploadCloud className="h-5 w-5 text-white/85" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-black text-white">Upload PDF</p>
            <p className="text-[11px] text-white/60 font-semibold">
              Drag & drop or click • PDF only • Max 30MB
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[12px] font-black text-white/90">{file ? "Selected" : "Choose file"}</p>
          <p className="text-[11px] text-white/55 font-semibold truncate max-w-[180px] sm:max-w-[240px]">
            {file ? `${file.name} • ${Math.round(file.size / 1024)} KB` : "No file"}
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export default function EducatorNotes() {
  const reduce = useReducedMotion();
  const user = useMemo(() => safeUser(), []);

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  // ✅ Filter tag (list)
  const [tagFilter, setTagFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // form
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [mins, setMins] = useState(5);
  const [visibility, setVisibility] = useState("all");
  const [gradeGroup, setGradeGroup] = useState("g78");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState(null);

  // ✅ Form tag (UPLOAD) — separate from filter
  const [formTag, setFormTag] = useState("");

  const tags = useMemo(() => ["robotics", "iot", "python", "3d", "electronics"], []);

  // ✅ Protect route
  useEffect(() => {
    const t = getToken();
    if (!t) window.location.href = "/login";
  }, []);

  const counts = useMemo(() => {
    const total = items.length;
    const downloads = items.reduce((s, x) => s + (x.downloads || 0), 0);
    const byTag = items.reduce((m, x) => {
      const k = x.tag || "other";
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {});
    const topTag = Object.entries(byTag).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, downloads, topTag };
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (tagFilter) qs.set("tag", tagFilter);

      const data = await api(`/api/notes/educator?${qs.toString()}`);
      setItems(data.items || []);
    } catch (e) {
      console.error("LOAD ERR:", e);
      alert(e.message);
      if (String(e.message || "").toLowerCase().includes("token")) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const resetForm = () => {
    setTitleEn("");
    setTitleHi("");
    setDescEn("");
    setDescHi("");
    setMins(5);
    setVisibility("all");
    setGradeGroup("g78");
    setCourseId("");
    setFile(null);
    setFormTag("");
  };

  const submit = async () => {
    if (!titleEn.trim()) return alert("Title (English) required");
    if (!formTag) return alert("Select tag");
    if (!file) return alert("PDF required");
    if (file.type !== "application/pdf") return alert("Only PDF allowed");
    if (visibility === "gradeGroup" && !gradeGroup) return alert("gradeGroup required");
    if (visibility === "course" && !courseId) return alert("courseId required");

    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        alert("Token missing. Please login again.");
        window.location.href = "/login";
        return;
      }

      const fd = new FormData();
      fd.append("titleEn", titleEn);
      fd.append("titleHi", titleHi);
      fd.append("descEn", descEn);
      fd.append("descHi", descHi);
      fd.append("tag", formTag);
      fd.append("mins", String(mins));
      fd.append("visibility", visibility);
      fd.append("gradeGroup", visibility === "gradeGroup" ? gradeGroup : "");
      fd.append("courseId", visibility === "course" ? courseId : "");
      fd.append("file", file); // ✅ backend multer should be upload.single("file")

      // ✅ Upload (IMPORTANT: don't set Content-Type manually)
      const res = await fetch(`${API_BASE}/api/notes/educator`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const txt = await res.text().catch(() => "");
      let data = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        data = { message: txt };
      }

      // ✅ Debug: see backend msg
      console.log("UPLOAD STATUS:", res.status);
      console.log("UPLOAD RESPONSE:", data);

      if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);

      setOpen(false);
      resetForm();
      await load();
    } catch (e) {
      console.error("UPLOAD ERR:", e);
      alert(e.message);

      if (String(e.message || "").toLowerCase().includes("token")) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this note?")) return;
    try {
      setLoading(true);
      await api(`/api/notes/educator/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let arr = [...items];
    const qq = q.trim().toLowerCase();

    if (qq) {
      arr = arr.filter((n) => {
        const t = (n.title?.en || "").toLowerCase();
        const d = (n.desc?.en || "").toLowerCase();
        return t.includes(qq) || d.includes(qq) || String(n.tag || "").includes(qq);
      });
    }

    if (tagFilter) arr = arr.filter((n) => n.tag === tagFilter);
    return arr;
  }, [items, q, tagFilter]);

  return (
    <div className="text-white relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="hidden sm:block">
            <div className="relative">
              <div className="size-12 rounded-2xl grid place-items-center border border-white/12 bg-gradient-to-br from-sky-400/25 via-indigo-400/18 to-fuchsia-400/20">
                <span className="text-sm font-black">
                  {initials(user?.name || user?.fullName || "Educator")}
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(0,0,0,0.55)]" />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-[0.22em] text-white/60 uppercase">
              Educator Resources
            </p>
            <h2 className="mt-1 text-[18px] md:text-[22px] font-black leading-tight">
              Notes Upload{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
                Console
              </span>
            </h2>
            <p className="mt-1 text-[12px] text-white/65 font-semibold">
              Upload PDFs — Students will see & download instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon={BookOpen} label="Total Notes" value={counts.total} />
          <StatPill icon={Download} label="Downloads" value={counts.downloads} />
          <StatPill icon={Tag} label="Top Tag" value={counts.topTag} />

          <button
            onClick={() => setOpen(true)}
            className={cn(
              "ml-auto inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-black",
              "bg-white/10 hover:bg-white/14 border border-white/10 hover:border-white/15 transition",
              "shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
            )}
          >
            <Plus className="h-4 w-4" /> Upload Note
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <TiltCard className="mt-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/55" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, description, tag..."
              className={cn(
                "w-full rounded-2xl pl-10 pr-3 py-3",
                "bg-black/25 border border-white/10 focus:border-white/20 outline-none",
                "text-[13px] font-semibold text-white placeholder:text-white/40"
              )}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            <div className="inline-flex items-center gap-2 text-[12px] font-extrabold text-white/65">
              <Filter className="h-4 w-4" />
              Filter:
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip active={!tagFilter} onClick={() => setTagFilter("")}>
                All
              </Chip>
              {tags.map((t) => (
                <Chip key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>
                  {t}
                </Chip>
              ))}
            </div>

            <button
              onClick={load}
              className="rounded-2xl px-4 py-3 bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition text-[12px] font-black inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 flex items-start gap-3">
          <div className="size-10 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-white/90">Visibility rules</p>
            <p className="text-[11px] text-white/65 font-semibold leading-relaxed">
              <span className="text-white/85">All Students</span> shows to everyone.{" "}
              <span className="text-white/85">Grade Group</span> shows only to selected class group.{" "}
              <span className="text-white/85">Course Only</span> limits to one course (by courseId).
            </p>
          </div>
        </div>
      </TiltCard>

      {/* List */}
      <div className="mt-4 grid gap-3">
        <AnimatePresence>
          {filtered.map((n, idx) => (
            <motion.div
              key={n._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ ...spring, delay: reduce ? 0 : idx * 0.02 }}
              whileHover={reduce ? {} : { y: -2 }}
              className={cn(
                "rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4",
                "shadow-[0_18px_60px_rgba(0,0,0,0.30)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
                      <FileText className="h-5 w-5 text-white/85" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-black text-white">{n.title?.en || "Untitled"}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-white/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          {n.tag}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {n.mins || 5} mins
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {n.visibility}
                          {n.visibility === "gradeGroup" ? ` (${n.gradeGroup})` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          {n.downloads || 0}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] text-white/70 font-semibold leading-relaxed line-clamp-2">
                        {n.desc?.en || "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          className={cn(
                            "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12px] font-black",
                            "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
                          )}
                          href={`${API_BASE}/api/notes/download/${n._id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                          Preview / Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => del(n._id)}
                  className={cn(
                    "rounded-2xl p-2.5",
                    "bg-red-500/10 hover:bg-red-500/16 border border-red-400/20 hover:border-red-300/25 transition"
                  )}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-200" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="fixed inset-0 z-[200] bg-black/65"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={spring}
              className="fixed inset-0 z-[210] grid place-items-center p-3"
            >
              <div className="w-full max-w-3xl rounded-[28px] border border-white/12 bg-[#0b1020] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.60)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-black text-white">Upload Notes PDF</p>
                    <p className="text-[11px] text-white/65 font-semibold">
                      Add title, tag, visibility and upload a PDF for students.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="rounded-2xl p-2 bg-white/10 border border-white/10 hover:bg-white/12 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Title (EN)</label>
                    <input
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Title (HI)</label>
                    <input
                      value={titleHi}
                      onChange={(e) => setTitleHi(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-extrabold text-white/70">Description (EN)</label>
                    <textarea
                      value={descEn}
                      onChange={(e) => setDescEn(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-extrabold text-white/70">Description (HI)</label>
                    <textarea
                      value={descHi}
                      onChange={(e) => setDescHi(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  {/* ✅ FORM TAG */}
                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Tag</label>
                    <select
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    >
                      <option value="" className="bg-[#0b1020] text-white">Select</option>
                      {tags.map((t) => (
                        <option key={t} value={t} className="bg-[#0b1020] text-white">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Estimated Read (mins)</label>
                    <input
                      type="number"
                      value={mins}
                      onChange={(e) => setMins(Number(e.target.value))}
                      min={1}
                      max={120}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    >
                      <option value="all" className="bg-[#0b1020] text-white">All Students</option>
                      <option value="gradeGroup" className="bg-[#0b1020] text-white">Grade Group</option>
                      <option value="course" className="bg-[#0b1020] text-white">Course Only</option>
                    </select>
                  </div>

                  {visibility === "gradeGroup" && (
                    <div>
                      <label className="text-[11px] font-extrabold text-white/70">Grade Group</label>
                      <select
                        value={gradeGroup}
                        onChange={(e) => setGradeGroup(e.target.value)}
                        className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                      >
                        <option value="g34" className="bg-[#0b1020] text-white">Class 3–4</option>
                        <option value="g56" className="bg-[#0b1020] text-white">Class 5–6</option>
                        <option value="g78" className="bg-[#0b1020] text-white">Class 7–8</option>
                        <option value="g910" className="bg-[#0b1020] text-white">Class 9–10</option>
                      </select>
                    </div>
                  )}

                  {visibility === "course" && (
                    <div>
                      <label className="text-[11px] font-extrabold text-white/70">Course ID</label>
                      <input
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                      />
                    </div>
                  )}

                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-extrabold text-white/70">PDF File</label>
                    <div className="mt-1">
                      <Dropzone file={file} onPick={setFile} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="rounded-2xl px-4 py-3 bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/15 transition text-[13px] font-black"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submit}
                    disabled={loading}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[13px] font-black inline-flex items-center justify-center gap-2",
                      "bg-gradient-to-r from-sky-400/25 via-indigo-400/20 to-fuchsia-400/25",
                      "border border-white/12 hover:border-white/18 hover:bg-white/10 transition",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {loading ? "Uploading..." : "Upload PDF"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
