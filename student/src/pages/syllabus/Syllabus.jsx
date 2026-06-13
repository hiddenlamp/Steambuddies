// ✅ src/pages/syllabus/Syllabus.jsx (ULTRA PREMIUM OVERHAUL)
import React, { useContext, useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronRight, Search, Sparkles, FileText, Pin, Clock, Tag,
  Download, Filter, ArrowLeft, RefreshCcw, X, SlidersHorizontal, Layers, GraduationCap
} from "lucide-react";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";

const cn = (...s) => s.filter(Boolean).join(" ");
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const spring = { type: "spring", stiffness: 300, damping: 24 };

const pageWrap = "min-h-screen pt-6 pb-28 transition-colors duration-500 overflow-x-hidden relative";
const container = "relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-10 lg:px-12 xl:px-14 2xl:pl-32 2xl:pr-24";

/** ✅ Safe text getter */
function pickText(value, language = "en") {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((x) => pickText(x, language)).filter(Boolean).join(", ");
  if (typeof value === "object") return value?.[language] || value?.en || value?.hi || "";
  return String(value);
}

function fmtAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/** Animated Background */
function AnimatedBackground({ isDark }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className={cn("absolute inset-0 transition-colors duration-500", isDark ? "bg-[#030712]" : "bg-[#f8fafc]")} />
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute -top-32 -left-24 h-[500px] w-[500px] rounded-full blur-[100px]", isDark ? "bg-sky-500/15" : "bg-sky-400/25")}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 50, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute top-32 -right-28 h-[600px] w-[600px] rounded-full blur-[120px]", isDark ? "bg-fuchsia-500/15" : "bg-fuchsia-400/20")}
      />
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute -bottom-20 left-1/3 h-[450px] w-[450px] rounded-full blur-[100px]", isDark ? "bg-emerald-500/15" : "bg-emerald-400/25")}
      />
      
      {/* Noise Overlay */}
      <div className={cn("absolute inset-0 pointer-events-none", isDark ? "opacity-[0.03]" : "opacity-[0.05]")} 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
}

function Badge({ isDark, children }) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider border",
        isDark
          ? "bg-white/10 text-white/90 border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.1)]"
          : "bg-slate-900 text-white border-black/10 shadow-[0_10px_25px_rgba(2,6,23,0.18)]"
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
      {children}
    </motion.span>
  );
}

/** ✅ Ultra 3D Card with Mouse Spotlight */
function SyllabusCard3D({ isDark, accent, children, idx = 0 }) {
  const reduce = useReducedMotion();
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative [perspective:1200px] h-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: idx * 0.05 }}
      whileHover={reduce ? {} : { y: -8 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Base glow when hovered */}
      <motion.div
        className={cn(
          "absolute -inset-1 rounded-[32px] blur-2xl transition-opacity duration-500",
          isHovered ? "opacity-60" : "opacity-0",
          isDark
            ? "bg-gradient-to-br from-sky-500/40 via-fuchsia-500/30 to-emerald-500/30"
            : "bg-gradient-to-br from-sky-400/50 via-fuchsia-400/40 to-emerald-400/40"
        )}
      />

      <motion.div
        className={cn(
          "relative h-full rounded-[30px] p-[1.5px] overflow-hidden",
          isDark
            ? "bg-gradient-to-br from-white/15 to-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            : "bg-gradient-to-br from-slate-200 to-white shadow-[0_20px_50px_rgba(2,6,23,0.08)]"
        )}
        whileHover={reduce ? {} : { rotateX: 6, rotateY: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Spotlight Effect overlay */}
        <div 
          className="pointer-events-none absolute -inset-px rounded-[30px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-20"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}, transparent 40%)`
          }}
        />

        <div
          className={cn(
            "relative rounded-[28px] overflow-hidden border backdrop-blur-2xl h-full flex flex-col transition-colors",
            isDark ? "bg-slate-900/60 border-white/10 group-hover:bg-slate-900/40" : "bg-white/80 border-white group-hover:bg-white/90"
          )}
        >
          <div className={cn("h-2 w-full bg-gradient-to-r", accent)} />
          <div className="relative px-6 pb-6 pt-5 flex-1 flex flex-col" style={{ transform: reduce ? "none" : "translateZ(30px)" }}>
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Chip({ isDark, active, icon, children, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "h-11 px-5 rounded-2xl text-[13px] font-bold inline-flex items-center gap-2 border transition-all duration-300",
        active
          ? isDark
            ? "bg-gradient-to-r from-white/20 to-white/10 text-white border-white/30 ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            : "bg-slate-900 text-white border-slate-900 shadow-[0_10px_20px_rgba(2,6,23,0.2)]"
          : isDark
          ? "bg-white/5 text-white/70 border-white/10 hover:bg-white/15 hover:text-white"
          : "bg-white/60 text-slate-700 border-black/5 hover:bg-white hover:text-slate-900 hover:shadow-md"
      )}
    >
      {icon ? <span className={cn(active ? "text-current" : "text-slate-400", isDark && !active && "text-white/50")}>{icon}</span> : null}
      {children}
    </motion.button>
  );
}

function SoftButton({ isDark, icon, children, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "h-11 px-4 rounded-2xl text-[13px] font-bold inline-flex items-center gap-2 border transition-all",
        isDark
          ? "bg-white/10 text-white/90 border-white/10 hover:bg-white/20"
          : "bg-white text-slate-900 border-slate-200 hover:shadow-lg shadow-sm"
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

function Select({ isDark, value, onChange, options = [] }) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={onChange}
        className={cn(
          "h-11 min-w-[170px] rounded-2xl px-4 pr-10 text-[13px] font-bold border outline-none appearance-none transition-all cursor-pointer",
          isDark
            ? "bg-white/5 text-white border-white/10 hover:bg-white/10 focus:border-white/30"
            : "bg-white/60 text-slate-900 border-black/5 hover:bg-white hover:shadow-md focus:border-sky-400"
        )}
      >
        {options.map((op) => (
          <option 
            key={op.value} 
            value={op.value} 
            className={isDark ? "bg-slate-900 text-white font-medium" : "bg-white text-slate-900 font-medium"}
          >
            {op.label}
          </option>
        ))}
      </select>
      <SlidersHorizontal className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", isDark ? "text-white/50 group-hover:text-white" : "text-slate-400 group-hover:text-slate-900")} />
    </div>
  );
}

export default function Syllabus() {
  const nav = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const langCtx = useContext(LanguageContext);
  const reduce = useReducedMotion();

  const rawTheme = themeCtx?.theme ?? "dark";
  const isDark = String(rawTheme).toLowerCase().includes("dark");
  const language = langCtx?.language || "en";

  const t = useMemo(() => {
    const en = {
      crumbHome: "Home",
      crumbHere: "Syllabus",
      title: "Course Syllabus",
      subtitle: "Year plans, chapter mappings & subject schedules — structured and updated.",
      searchPH: "Search syllabus, classes, or subjects...",
      pinned: "Pinned",
      tabs: { all: "All Syllabuses", pinned: "Pinned", recent: "Recent" },
      classLevel: "Class",
      download: "Download PDF",
      reset: "Reset Filters",
      refresh: "Refresh",
      emptyTitle: "No syllabus found",
      emptyHint: "Try adjusting your search or resetting filters.",
      backHome: "Back to Dashboard",
      pinIt: "Pin Syllabus",
      unpinIt: "Unpin",
      downloads: "downloads",
      lastOpen: "last opened",
      category: "Class Level",
    };

    const hi = {
      crumbHome: "Home",
      crumbHere: "Syllabus",
      title: "कोर्स सिलेबस",
      subtitle: "ईयर प्लान्स, चैप्टर मैपिंग्स व सब्जेक्ट शेड्यूल्स — व्यवस्थित और अपडेटेड।",
      searchPH: "सिलेबस, क्लास या सब्जेक्ट खोजें...",
      pinned: "पिन्ड",
      tabs: { all: "सभी सिलेबस", pinned: "पिन्ड", recent: "रीसेंट" },
      classLevel: "कक्षा",
      download: "PDF डाउनलोड",
      reset: "फिल्टर रीसेट",
      refresh: "रिफ्रेश",
      emptyTitle: "कोई सिलेबस नहीं मिला",
      emptyHint: "Search बदलें या filters reset करें।",
      backHome: "डैशबोर्ड पर जाएँ",
      pinIt: "सिलेबस पिन करें",
      unpinIt: "अनपिन करें",
      downloads: "डाउनलोड",
      lastOpen: "लास्ट ओपन",
      category: "क्लास लेवल",
    };

    return language === "hi" ? hi : en;
  }, [language]);

  // API data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); 
  const [cat, setCat] = useState("all");

  const LS_KEY = "hl_syllabus_state_v1";
  const [syllabusState, setSyllabusState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : { pinned: {}, lastOpened: {}, downloads: {} };
    } catch {
      return { pinned: {}, lastOpened: {}, downloads: {} };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(syllabusState));
    } catch {}
  }, [syllabusState]);

  const togglePin = useCallback((id) => {
    setSyllabusState((prev) => {
      const pinned = { ...(prev.pinned || {}) };
      if (pinned[id]) delete pinned[id];
      else pinned[id] = true;
      return { ...prev, pinned };
    });
  }, []);

  const markOpened = useCallback((id) => {
    setSyllabusState((prev) => ({
      ...prev,
      lastOpened: { ...(prev.lastOpened || {}), [id]: Date.now() },
      downloads: { ...(prev.downloads || {}), [id]: ((prev.downloads || {})[id] || 0) + 1 },
    }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (cat !== "all") qs.set("classLevel", cat);

      const res = await fetch(`${API_BASE}/api/syllabus/student?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load syllabus");

      const list = Array.isArray(data) ? data : data.items || [];
      setItems(list);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, cat]);

  useEffect(() => {
    load();
  }, [load]);

  const classes = useMemo(() => {
    const uniq = new Set((items || []).map((x) => x.classLevel).filter(Boolean));
    return Array.from(uniq);
  }, [items]);

  const syllabusList = useMemo(() => {
    return (items || []).map((n) => {
      const id = n._id || n.id;
      return { ...n, id };
    });
  }, [items]);

  const filtered = useMemo(() => {
    let arr = [...syllabusList];

    arr = arr.map((n) => ({
      ...n,
      pinned: !!syllabusState?.pinned?.[n.id],
      lastOpened: syllabusState?.lastOpened?.[n.id] ?? 0,
      downloadsLocal: syllabusState?.downloads?.[n.id] ?? 0,
    }));

    if (tab === "pinned") arr = arr.filter((x) => x.pinned);

    const qq = q.trim().toLowerCase();
    if (qq) {
      arr = arr.filter((x) => {
        const title = pickText(x.title, language).toLowerCase();
        const desc = pickText(x.desc, language).toLowerCase();
        const subject = String(x.subject || "").toLowerCase();
        return title.includes(qq) || desc.includes(qq) || subject.includes(qq);
      });
    }

    if (tab === "recent") arr.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    else arr.sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1));

    return arr;
  }, [syllabusList, syllabusState, tab, q, language]);

  const resetAll = () => {
    setQ("");
    setTab("all");
    setCat("all");
  };

  return (
    <div className={pageWrap}>
      <AnimatedBackground isDark={isDark} />

      <div className={container}>
        {/* Top Nav Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className={cn("flex items-center gap-2 text-[13px] font-medium tracking-wide", isDark ? "text-white/60" : "text-slate-500")}>
            <Link to="/home" className={cn("hover:opacity-100 transition-opacity", isDark ? "hover:text-white" : "hover:text-slate-900")}>
              {t.crumbHome}
            </Link>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{t.crumbHere}</span>
          </div>

          <SoftButton isDark={isDark} icon={<ArrowLeft className="h-4 w-4" />} onClick={() => nav("/home")}>
            {t.backHome}
          </SoftButton>
        </div>

        {/* Hero Header */}
        <div className="mt-12 text-center relative">
          <div className="flex items-center justify-center">
            <Badge isDark={isDark}>{language === "hi" ? "कक्षा-वाइज़ सिलेबस" : "Class-Wise Syllabus"}</Badge>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={cn("mt-6 text-5xl sm:text-7xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}
          >
            {t.title}{" "}
            <span className="bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-500 bg-clip-text text-transparent inline-block hover:scale-110 transition-transform cursor-default">
              ✨
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}
            className={cn("mx-auto mt-6 max-w-2xl text-[15px] sm:text-[17px] font-medium leading-relaxed", isDark ? "text-white/60" : "text-slate-600")}
          >
            {t.subtitle}
          </motion.p>
        </div>

        {/* Sticky Glassmorphic Controls */}
        <div className="sticky top-4 z-40 mt-12 transition-all">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className={cn(
              "rounded-[32px] p-[1.5px] shadow-[0_20px_60px_rgba(0,0,0,0.1)]",
              isDark ? "bg-gradient-to-r from-sky-500/30 via-indigo-500/30 to-fuchsia-500/30" : "bg-gradient-to-r from-sky-400/50 via-indigo-400/50 to-fuchsia-400/50"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[30px] border backdrop-blur-3xl p-4 transition-all",
                isDark ? "bg-slate-950/70 border-white/10" : "bg-white/80 border-white/60"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 group">
                  <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", isDark ? "text-white/40 group-focus-within:text-sky-400" : "text-slate-400 group-focus-within:text-sky-500")} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.searchPH}
                    className={cn(
                      "w-full h-14 rounded-2xl pl-12 pr-12 text-[15px] font-bold outline-none border transition-all shadow-inner",
                      isDark
                        ? "bg-black/20 text-white placeholder:text-white/30 border-white/10 focus:border-sky-500/50 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(14,165,233,0.15)]"
                        : "bg-slate-100/50 text-slate-900 placeholder:text-slate-400 border-black/5 focus:border-sky-400 focus:bg-white focus:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
                    )}
                  />
                  <AnimatePresence>
                    {q && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        type="button"
                        onClick={() => setQ("")}
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl grid place-items-center border hover:scale-105 transition-transform",
                          isDark ? "bg-white/10 border-white/20 text-white/90 hover:bg-white/20" : "bg-white border-black/10 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <Chip isDark={isDark} active={tab === "all"} icon={<Layers className="h-4 w-4" />} onClick={() => setTab("all")}>
                    {t.tabs.all}
                  </Chip>
                  <Chip isDark={isDark} active={tab === "pinned"} icon={<Pin className="h-4 w-4" />} onClick={() => setTab("pinned")}>
                    {t.tabs.pinned}
                  </Chip>
                  <Chip isDark={isDark} active={tab === "recent"} icon={<Clock className="h-4 w-4" />} onClick={() => setTab("recent")}>
                    {t.tabs.recent}
                  </Chip>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    isDark={isDark}
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                    options={[
                      { value: "all", label: `${t.category}: ${language === "hi" ? "सभी" : "All"}` },
                      ...classes.map((c) => ({ value: c, label: c })),
                    ]}
                  />

                  <SoftButton isDark={isDark} icon={<Filter className="h-4 w-4" />} onClick={resetAll}>
                    {t.reset}
                  </SoftButton>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Syllabus Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((n, idx) => {
              const title = pickText(n.title, language) || "Untitled Syllabus";
              const desc = pickText(n.desc, language) || "No description provided.";
              const subject = n.subject || "General";
              const classLevel = n.classLevel || "";

              return (
                <SyllabusCard3D
                  key={n.id}
                  isDark={isDark}
                  accent={"from-sky-400 via-indigo-400 to-fuchsia-500"}
                  idx={idx}
                >
                  <div className="mt-[-42px] flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={cn(
                          "h-14 w-14 rounded-[22px] grid place-items-center border backdrop-blur-2xl transition-shadow",
                          isDark
                            ? "bg-slate-900/80 border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:shadow-[0_20px_40px_rgba(56,189,248,0.2)]"
                            : "bg-white/90 border-white shadow-[0_20px_40px_rgba(2,6,23,0.1)] group-hover:shadow-[0_20px_40px_rgba(56,189,248,0.2)]"
                        )}
                        whileHover={reduce ? {} : { rotate: 8, scale: 1.05 }}
                      >
                        <GraduationCap className={cn("h-6 w-6", isDark ? "text-white" : "text-indigo-600")} />
                      </motion.div>

                      <AnimatePresence>
                        {n.pinned && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border backdrop-blur-xl uppercase tracking-wider",
                              isDark ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
                            )}
                          >
                            <Pin className="h-3.5 w-3.5" />
                            {t.pinned}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, rotate: n.pinned ? 0 : -10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => togglePin(n.id)}
                      className={cn(
                        "h-11 w-11 rounded-[20px] grid place-items-center border backdrop-blur-xl transition-colors",
                        isDark ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-white border-black/5 shadow-sm hover:bg-slate-50"
                      )}
                      title={n.pinned ? t.unpinIt : t.pinIt}
                    >
                      <Pin
                        className={cn("h-5 w-5 transition-colors", n.pinned ? "text-fuchsia-500" : isDark ? "text-white/60 group-hover:text-white" : "text-slate-400 group-hover:text-slate-700")}
                        fill={n.pinned ? "currentColor" : "none"}
                      />
                    </motion.button>
                  </div>

                  <div className="flex-1 mt-6">
                    <h3 className={cn("text-[17px] font-black leading-tight", isDark ? "text-white" : "text-slate-900")}>
                      {title}
                    </h3>
                    <p className={cn("mt-2 text-[13px] font-medium leading-relaxed line-clamp-2", isDark ? "text-white/60" : "text-slate-500")}>
                      {desc}
                    </p>
                  </div>

                  <div className={cn("mt-6 grid grid-cols-2 gap-y-3 gap-x-2 text-[12px] font-bold", isDark ? "text-white/50" : "text-slate-500")}>
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-500" />
                      {classLevel}
                    </span>
                    <span className="inline-flex items-center gap-2 justify-end">
                      <Tag className="h-4 w-4 text-sky-500" />
                      <span className="truncate">{subject}</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Download className="h-4 w-4 text-fuchsia-500" />
                      {n.downloadsLocal} {t.downloads}
                    </span>
                    <span className="inline-flex items-center gap-2 justify-end">
                      <RefreshCcw className="h-4 w-4 text-indigo-400" />
                      <span className="truncate">{fmtAgo(n.lastOpened)}</span>
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      markOpened(n.id);
                      window.open(`${API_BASE}/api/syllabus/download/${n.id}`, "_blank", "noopener,noreferrer");
                    }}
                    className={cn(
                      "mt-6 w-full rounded-2xl px-4 py-3.5 text-[14px] font-black tracking-wide inline-flex items-center justify-center gap-2 border transition-all duration-300 relative overflow-hidden group/btn",
                      isDark
                        ? "bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                        : "bg-slate-900 text-white border-slate-800 hover:bg-slate-800 hover:shadow-lg"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500" />
                    <Download className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{t.download}</span>
                  </motion.button>
                </SyllabusCard3D>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-12 mx-auto max-w-md rounded-[32px] border backdrop-blur-2xl p-10 text-center shadow-2xl",
              isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
            )}
          >
            <div
              className={cn(
                "mx-auto h-20 w-20 rounded-[28px] grid place-items-center border shadow-inner",
                isDark ? "bg-slate-900 border-white/20 text-white/50" : "bg-slate-50 border-slate-200 text-slate-400"
              )}
            >
              <FileText className="h-10 w-10" />
            </div>
            <p className={cn("mt-6 text-xl font-black", isDark ? "text-white" : "text-slate-900")}>{t.emptyTitle}</p>
            <p className={cn("mt-2 text-[15px] font-medium leading-relaxed", isDark ? "text-white/60" : "text-slate-500")}>{t.emptyHint}</p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetAll}
              className={cn(
                "mt-8 px-8 py-3 rounded-2xl font-bold text-[14px] transition-colors border",
                isDark ? "bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30" : "bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100"
              )}
            >
              {t.reset}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
