// src/pages/syllabus/EducatorSyllabus.jsx
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
  BookOpen,
  Users,
  RefreshCcw,
} from "lucide-react";

import { GRADE_GROUPS, CATEGORIES } from "../courses/courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");

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

export default function EducatorSyllabus() {
  const reduce = useReducedMotion();
  const user = useMemo(() => safeUser(), []);

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [classFilter, setClassFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // form
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [classLevel, setClassLevel] = useState("c10");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const t = getToken();
    if (!t) window.location.href = "/login";
  }, []);

  const counts = useMemo(() => {
    const total = items.length;
    const downloads = items.reduce((s, x) => s + (x.downloads || 0), 0);
    return { total, downloads };
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (classFilter) qs.set("classLevel", classFilter);

      const data = await api(`/api/syllabus/educator?${qs.toString()}`);
      setItems(data.items || []);
    } catch (e) {
      console.error("LOAD ERR:", e);
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
    setVisibility("all");
    setClassLevel("c10");
    setSubject("");
    setFile(null);
  };

  const submit = async () => {
    if (!titleEn.trim()) return alert("Title (English) required");
    if (!classLevel) return alert("Select Class Level");
    if (!file) return alert("PDF required");
    if (file.type !== "application/pdf") return alert("Only PDF allowed");

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
      fd.append("classLevel", classLevel);
      fd.append("subject", subject);
      fd.append("visibility", visibility);
      fd.append("file", file); 

      const res = await fetch(`${API_BASE}/api/syllabus/educator`, {
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
    if (!confirm("Delete this syllabus?")) return;
    try {
      setLoading(true);
      await api(`/api/syllabus/educator/${id}`, { method: "DELETE" });
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
        return t.includes(qq) || d.includes(qq) || String(n.subject || "").includes(qq);
      });
    }

    if (classFilter) arr = arr.filter((n) => n.classLevel === classFilter);
    return arr;
  }, [items, q, classFilter]);

  const getClassName = (cid) => {
    const f = GRADE_GROUPS.find((g) => g.id === cid);
    return f ? (f.label?.en || cid) : cid;
  };

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
              <div className="size-12 rounded-2xl grid place-items-center border border-white/12 bg-gradient-to-br from-emerald-400/25 via-teal-400/18 to-cyan-400/20">
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
              Syllabus <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">Manager</span>
            </h2>
            <p className="mt-1 text-[12px] text-white/65 font-semibold">
              Upload Year Plans, Chapter Mappings & Schedule PDFs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon={BookOpen} label="Total Files" value={counts.total} />
          <StatPill icon={Download} label="Downloads" value={counts.downloads} />

          <button
            onClick={() => setOpen(true)}
            className={cn(
              "ml-auto inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-black",
              "bg-white/10 hover:bg-white/14 border border-white/10 hover:border-white/15 transition",
              "shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
            )}
          >
            <Plus className="h-4 w-4" /> Add Syllabus
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
              placeholder="Search by title, description..."
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
              Filter Class:
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip active={!classFilter} onClick={() => setClassFilter("")}>
                All
              </Chip>
              {GRADE_GROUPS.map((g) => (
                <Chip key={g.id} active={classFilter === g.id} onClick={() => setClassFilter(g.id)}>
                  {g.label.en}
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
                    <div className="size-12 rounded-2xl grid place-items-center bg-emerald-500/10 border border-emerald-500/20">
                      <FileText className="h-5 w-5 text-emerald-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-black text-white">{n.title?.en || "Untitled"}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-white/60">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {getClassName(n.classLevel)}
                        </span>
                        {n.subject && (
                          <span className="inline-flex items-center gap-1.5">
                            • {n.subject}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {n.visibility === "classLevel" ? `Only ${getClassName(n.classLevel)}` : "All Students"}
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
                            "bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/20 transition text-emerald-200"
                          )}
                          href={`${API_BASE}/api/syllabus/download/${n._id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => del(n._id)}
                  className={cn(
                    "rounded-2xl p-2.5 flex-shrink-0",
                    "bg-red-500/10 hover:bg-red-500/16 border border-red-400/20 hover:border-red-300/25 transition"
                  )}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-200" />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && !loading && (
             <div className="text-center p-8 text-white/50 text-sm font-semibold">
               No syllabus files found. Upload one to get started!
             </div>
          )}
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
                    <p className="text-[14px] font-black text-white">Upload Syllabus PDF</p>
                    <p className="text-[11px] text-white/65 font-semibold">
                      Add year plan or chapter schedule.
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
                      placeholder="e.g. Class 10 Science Year Plan"
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Title (HI) - Optional</label>
                    <input
                      value={titleHi}
                      onChange={(e) => setTitleHi(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-extrabold text-white/70">Description</label>
                    <textarea
                      value={descEn}
                      onChange={(e) => setDescEn(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    >
                      {GRADE_GROUPS.map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#0b1020] text-white">
                          {g.label.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-white/70">Subject Category (Optional)</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    >
                      <option value="" className="bg-[#0b1020] text-white">-- General / Any --</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name.en} className="bg-[#0b1020] text-white">
                          {c.name.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[11px] font-extrabold text-white/70">Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1 w-full rounded-2xl px-3 py-3 bg-black/25 border border-white/10 outline-none focus:border-white/20 text-[13px] font-semibold"
                    >
                      <option value="all" className="bg-[#0b1020] text-white">All Students (Anyone can see)</option>
                      <option value="classLevel" className="bg-[#0b1020] text-white">Only this Class Level</option>
                    </select>
                  </div>

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
                      "bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25",
                      "border border-white/12 hover:border-white/18 hover:bg-white/10 transition",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {loading ? "Uploading..." : "Upload Syllabus"}
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
