// src/pages/manuals/Manual.jsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

/* ================= i18n ================= */
const i18n = {
  en: {
    title: "Student Manuals",
    subtitle: "Download educator-shared manuals in PDF. Search, filter, and keep learning.",
    searchPh: "Search manual title, topic, tag...",
    category: "Category",
    grade: "Class",
    sort: "Sort",
    newest: "Newest first",
    oldest: "Oldest first",
    aZ: "A → Z",
    zA: "Z → A",
    all: "All",
    reset: "Reset",
    refresh: "Refresh",
    downloading: "Downloading…",
    download: "Download PDF",
    postedOn: "Posted on",
    emptyTitle: "No manuals found",
    emptyDesc: "Try clearing filters or searching with different keywords.",
    errorTitle: "Couldn’t load manuals",
    tryAgain: "Try again",
    pdf: "PDF",
    count: (n) => `${n} manual${n === 1 ? "" : "s"}`,
    noDesc: "No description provided.",
    back: "Back",
  },
  hi: {
    title: "स्टूडेंट मैनुअल",
    subtitle: "एजुकेटर द्वारा शेयर किए गए PDF मैनुअल डाउनलोड करें। सर्च/फ़िल्टर करके सीखते रहें।",
    searchPh: "मैनुअल का नाम, टॉपिक, टैग सर्च करें…",
    category: "कैटेगरी",
    grade: "कक्षा",
    sort: "सॉर्ट",
    newest: "नया पहले",
    oldest: "पुराना पहले",
    aZ: "A → Z",
    zA: "Z → A",
    all: "All",
    reset: "रीसेट",
    refresh: "रिफ्रेश",
    downloading: "डाउनलोड हो रहा है…",
    download: "PDF डाउनलोड",
    postedOn: "पोस्ट की तारीख",
    emptyTitle: "कोई मैनुअल नहीं मिला",
    emptyDesc: "फ़िल्टर हटाकर देखें या अलग कीवर्ड सर्च करें।",
    errorTitle: "मैनुअल लोड नहीं हो पाया",
    tryAgain: "फिर से कोशिश करें",
    pdf: "PDF",
    count: (n) => `${n} मैनुअल`,
    noDesc: "डिस्क्रिप्शन उपलब्ध नहीं है।",
    back: "Back",
  },
};

/* ================= static lists (as you asked) ================= */
const STATIC_CATEGORIES = [
  "All",
  "3D Printing",
  "3D Designing",
  "Electronics",
  "Robotics",
  "IoT",
  "Scratch",
  "App Development",
];

const STATIC_CLASSES = ["All", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

/* ================= helpers ================= */
const safeText = (v, lang) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v?.[lang] ?? v?.en ?? v?.hi ?? "";
  return "";
};
const formatDate = (iso, lang) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
};

const norm = (s) => String(s || "").trim();
const getCategory = (m) =>
  norm(m?.category || m?.manualCategory || m?.topic || m?.stream || m?.track || "");
const getGrade = (m) =>
  norm(m?.grade || m?.class || m?.classLevel || m?.standard || m?.forClass || "");
const getFileUrl = (m) => m?.fileUrl || m?.url || m?.pdfUrl || m?.file?.url || m?.filePath || "";

const CAT_THEME = {
  "3d printing": { ring: "ring-violet-400/25", grad: "from-violet-500/25 via-indigo-500/18 to-fuchsia-500/18" },
  "3d designing": { ring: "ring-fuchsia-400/25", grad: "from-fuchsia-500/22 via-pink-500/16 to-rose-500/16" },
  electronics: { ring: "ring-emerald-400/25", grad: "from-emerald-500/22 via-teal-500/16 to-cyan-500/16" },
  robotics: { ring: "ring-amber-400/25", grad: "from-amber-500/22 via-orange-500/16 to-red-500/16" },
  iot: { ring: "ring-sky-400/25", grad: "from-sky-500/22 via-blue-500/16 to-indigo-500/16" },
  scratch: { ring: "ring-orange-400/25", grad: "from-orange-500/22 via-yellow-500/16 to-lime-500/16" },
  "app development": { ring: "ring-indigo-400/25", grad: "from-indigo-500/22 via-purple-500/16 to-sky-500/16" },
  default: { ring: "ring-white/10", grad: "from-slate-500/18 via-slate-500/12 to-slate-500/10" },
};
const catTheme = (cat) => CAT_THEME[(cat || "").toLowerCase()] || CAT_THEME.default;

function Chip({ icon: Icon, children, isLight }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-extrabold",
        isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-white/80"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 opacity-80" /> : null}
      {children}
    </span>
  );
}

function SkeletonCard({ isLight }) {
  return (
    <div
      className={cn(
        "rounded-[26px] border p-4",
        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.06] backdrop-blur-xl"
      )}
    >
      <div className={cn("h-5 w-2/3 rounded-lg", isLight ? "bg-slate-100" : "bg-white/10")} />
      <div className={cn("mt-3 h-4 w-full rounded-lg", isLight ? "bg-slate-100" : "bg-white/10")} />
      <div className={cn("mt-2 h-4 w-4/5 rounded-lg", isLight ? "bg-slate-100" : "bg-white/10")} />
      <div className="mt-4 h-11 w-full rounded-2xl bg-white/10" />
    </div>
  );
}

/* ✅ Native select with proper dark/light styling (dropdown will show) */
function SelectField({ label, value, onChange, options, isLight }) {
  return (
    <div className="min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-2xl border px-3 py-2.5 text-sm font-extrabold outline-none transition",
          "appearance-none",
          isLight
            ? "bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-400/30"
            : "bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-sky-400/25"
        )}
        style={{
          // ✅ improves dropdown option readability in some browsers
          colorScheme: isLight ? "light" : "dark",
        }}
      >
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            style={{
              background: isLight ? "#ffffff" : "#0b1220",
              color: isLight ? "#0f172a" : "#ffffff",
            }}
          >
            {opt}
          </option>
        ))}
      </select>
      <p className={cn("mt-1 text-xs font-bold", isLight ? "text-slate-600" : "text-white/65")}>{label}</p>
    </div>
  );
}

export default function Manual() {
  const nav = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const langCtx = useContext(LanguageContext);

  const theme = themeCtx?.theme || "dark"; // your app toggles this
  const isLight = theme === "light";

  const lang = langCtx?.lang || "en";
  const t = i18n[lang] || i18n.en;

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [grade, setGrade] = useState("All");
  const [sort, setSort] = useState(t.newest);

  const [downloadingId, setDownloadingId] = useState("");

  const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const API_ROOT = String(RAW_BASE).replace(/\/+$/, "");

  const toAbsFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const cleaned = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
    return `${API_ROOT}${cleaned}`;
  };

  const fetchManuals = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      // ✅ your axios instance returns data directly
      const data = await api.get("/manuals/public");
      const arr = Array.isArray(data) ? data : data?.data;
      setRaw(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setErr(getApiError?.(e) || "Failed to fetch manuals");
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = [...raw];

    if (category !== "All") {
      list = list.filter((m) => (getCategory(m) || "").toLowerCase() === category.toLowerCase());
    }
    if (grade !== "All") {
      list = list.filter((m) => String(getGrade(m)) === String(grade));
    }

    if (qq) {
      list = list.filter((m) => {
        const title = safeText(m?.title, lang).toLowerCase();
        const desc = safeText(m?.description, lang).toLowerCase();
        const cat = (getCategory(m) || "").toLowerCase();
        const grd = (getGrade(m) || "").toLowerCase();
        const tags = Array.isArray(m?.tags) ? m.tags.join(" ").toLowerCase() : "";
        return title.includes(qq) || desc.includes(qq) || cat.includes(qq) || grd.includes(qq) || tags.includes(qq);
      });
    }

    const getTime = (m) => {
      const d = new Date(m?.createdAt || m?.updatedAt || 0).getTime();
      return Number.isFinite(d) ? d : 0;
    };

    if (sort === t.newest) list.sort((a, b) => getTime(b) - getTime(a));
    if (sort === t.oldest) list.sort((a, b) => getTime(a) - getTime(b));
    if (sort === t.aZ) list.sort((a, b) => safeText(a?.title, lang).localeCompare(safeText(b?.title, lang)));
    if (sort === t.zA) list.sort((a, b) => safeText(b?.title, lang).localeCompare(safeText(a?.title, lang)));

    return list;
  }, [raw, q, category, grade, sort, lang, t]);

  const resetFilters = () => {
    setQ("");
    setCategory("All");
    setGrade("All");
    setSort(t.newest);
  };

  const handleDownload = async (manual) => {
    const url = toAbsFileUrl(getFileUrl(manual));
    const id = manual?._id || manual?.id || url || "x";
    if (!url) return;

    setDownloadingId(id);
    try {
      const resp = await axios.get(url, { responseType: "blob" });
      const blob = new Blob([resp.data], { type: "application/pdf" });
      const href = URL.createObjectURL(blob);

      const title = safeText(manual?.title, lang) || "manual";
      const fileName =
        manual?.fileName || `${title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "")}.pdf`;

      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId("");
    }
  };

  /* ================= Theme styles ================= */
  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-[#05070f] text-white";

  const headerCard = isLight
    ? "border-slate-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.12)]"
    : "border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)]";

  const subtle = isLight ? "text-slate-600" : "text-white/70";

  const softBtn = isLight
    ? "bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200"
    : "bg-white/5 border-white/10 text-white hover:bg-white/10";

  const primaryBtn = isLight
    ? "bg-slate-900 text-white hover:bg-slate-800"
    : "bg-white text-slate-900 hover:bg-white/90";

  return (
    <div className={cn("min-h-screen relative overflow-x-hidden", pageBg)}>
      {/* Background like syllabus (dark + light both) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            "absolute inset-0",
            isLight
              ? "bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_84%_16%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(circle_at_60%_88%,rgba(244,114,182,0.12),transparent_60%)]"
              : "bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.24),transparent_55%),radial-gradient(circle_at_84%_16%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(circle_at_60%_88%,rgba(244,114,182,0.16),transparent_60%)]"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 opacity-[0.07]",
            isLight
              ? "bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:44px_44px]"
              : "bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]"
          )}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={cn("rounded-[30px] border p-5 sm:p-6", headerCard)}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
                    isLight ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" /> {t.pdf}
                </span>

                <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black", softBtn)}>
                  <Sparkles className="h-3.5 w-3.5" /> PRO
                </span>

                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black transition", softBtn)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t.back}
                </button>
              </div>

              <h1 className={cn("mt-3 text-2xl sm:text-3xl font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                {t.title}{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400">
                  Hub
                </span>
              </h1>
              <p className={cn("mt-2 max-w-2xl text-sm sm:text-base font-semibold", subtle)}>{t.subtitle}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip icon={Layers} isLight={isLight}>
                  {t.count(filtered.length)}
                </Chip>
                {category !== "All" ? (
                  <Chip icon={Tag} isLight={isLight}>
                    {category}
                  </Chip>
                ) : null}
                {grade !== "All" ? (
                  <Chip icon={Tag} isLight={isLight}>
                    Class {grade}
                  </Chip>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={fetchManuals}
                className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition", softBtn)}
              >
                <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                {t.refresh}
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition", softBtn)}
              >
                <Filter className="h-4 w-4" />
                {t.reset}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition",
                  isLight ? "bg-slate-50 border-slate-200" : "bg-black/25 border-white/10"
                )}
              >
                <Search className={cn("h-4 w-4", isLight ? "text-slate-500" : "text-white/60")} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.searchPh}
                  className={cn(
                    "w-full bg-transparent text-sm font-semibold outline-none",
                    isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/40"
                  )}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <SelectField
                label={t.category}
                value={category}
                onChange={setCategory}
                options={STATIC_CATEGORIES}
                isLight={isLight}
              />
            </div>

            <div className="lg:col-span-2">
              <SelectField
                label={t.grade}
                value={grade}
                onChange={setGrade}
                options={STATIC_CLASSES}
                isLight={isLight}
              />
            </div>

            <div className="lg:col-span-2">
              <SelectField
                label={t.sort}
                value={sort}
                onChange={setSort}
                options={[t.newest, t.oldest, t.aZ, t.zA]}
                isLight={isLight}
              />
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {err ? (
          <div className={cn("mt-5 rounded-2xl border p-4", isLight ? "border-red-200 bg-red-50" : "border-red-500/30 bg-red-500/10")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn("font-black", isLight ? "text-red-800" : "text-red-200")}>{t.errorTitle}</p>
                <p className={cn("mt-1 text-sm font-semibold", isLight ? "text-red-700" : "text-red-200/80")}>{err}</p>
              </div>
              <button
                type="button"
                onClick={fetchManuals}
                className={cn("inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition", isLight ? "bg-red-700 text-white hover:bg-red-800" : "bg-red-200 text-slate-900 hover:bg-red-100")}
              >
                <RefreshCw className="h-4 w-4" /> {t.tryAgain}
              </button>
            </div>
          </div>
        ) : null}

        {/* Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} isLight={isLight} />) : null}

          {!loading && !err ? (
            <AnimatePresence>
              {filtered.map((m) => {
                const title = safeText(m?.title, lang) || "Untitled Manual";
                const desc = safeText(m?.description, lang);
                const date = formatDate(m?.createdAt, lang);

                const cat = getCategory(m) || "General";
                const grd = getGrade(m);
                const th = catTheme(cat);

                const fileUrl = toAbsFileUrl(getFileUrl(m));
                const id = m?._id || m?.id || fileUrl || Math.random().toString(36);

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.18 }}
                    whileHover={{ y: -6 }}
                    className={cn(
                      "group relative overflow-hidden rounded-[26px] border p-4",
                      isLight ? "border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,6,23,0.10)]" : "border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.35)]",
                      "ring-1",
                      isLight ? "ring-black/5" : th.ring
                    )}
                  >
                    {/* color layer */}
                    <div className={cn("absolute inset-0", `bg-gradient-to-br ${th.grad}`, isLight ? "opacity-70" : "opacity-100")} />
                    <div className={cn("absolute inset-0", isLight ? "opacity-[0.08]" : "opacity-[0.10]", "bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:22px_22px]")} />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={cn("line-clamp-2 text-[15px] font-black", isLight ? "text-slate-900" : "text-white")} title={title}>
                            {title}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                                isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-white/85"
                              )}
                            >
                              <Tag className="h-3.5 w-3.5 opacity-80" /> {cat}
                            </span>

                            {grd ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                                  isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-white/85"
                                )}
                              >
                                <Layers className="h-3.5 w-3.5 opacity-80" /> Class {grd}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
                          <FileText className={cn("h-5 w-5", isLight ? "text-slate-700" : "text-white/85")} />
                        </div>
                      </div>

                      <p className={cn("mt-3 line-clamp-3 text-sm font-semibold", isLight ? "text-slate-700" : "text-white/80")} title={desc || ""}>
                        {desc || t.noDesc}
                      </p>

                      <div className={cn("mt-4 flex items-center gap-2 text-xs font-semibold", isLight ? "text-slate-600" : "text-white/75")}>
                        {date ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {t.postedOn}: {date}
                          </span>
                        ) : null}
                      </div>

                      {/* Download only */}
                      <button
                        type="button"
                        onClick={() => handleDownload(m)}
                        disabled={!fileUrl || downloadingId === id}
                        className={cn(
                          "mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition",
                          isLight ? primaryBtn : primaryBtn,
                          !fileUrl || downloadingId === id ? "opacity-70 cursor-not-allowed" : ""
                        )}
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === id ? t.downloading : t.download}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : null}
        </div>

        {/* Empty */}
        {!loading && !err && filtered.length === 0 ? (
          <div className={cn("mt-10 rounded-[26px] border p-6 text-center", headerCard)}>
            <p className={cn("text-base font-black", isLight ? "text-slate-900" : "text-white")}>{t.emptyTitle}</p>
            <p className={cn("mt-2 text-sm font-semibold", subtle)}>{t.emptyDesc}</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={resetFilters}
                className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition", softBtn)}
              >
                <Filter className="h-4 w-4" />
                {t.reset}
              </button>
              <button
                type="button"
                onClick={fetchManuals}
                className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition", softBtn)}
              >
                <RefreshCw className="h-4 w-4" />
                {t.refresh}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
