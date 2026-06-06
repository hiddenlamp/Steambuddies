import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, Layers, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cn = (...s) => s.filter(Boolean).join(" ");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const pickLang = (v, lang, fallback = "") => {
  if (!v) return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && !Array.isArray(v)) {
    const x = v?.[lang] ?? v?.en ?? v?.hi;
    if (typeof x === "string" || typeof x === "number") return String(x);
  }
  return fallback;
};

const normalizeStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string" || typeof x === "number") return String(x);
      if (typeof x === "object") {
        const t = x?.title?.en ?? x?.title?.hi ?? x?.en ?? x?.hi;
        if (typeof t === "string" || typeof t === "number") return String(t);
      }
      return null;
    })
    .filter(Boolean);
};

export default function CourseCard({ course, cat, theme, lang, gradeLabel }) {
  const nav = useNavigate();
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 30 });

  const courseId = course?.id || course?._id || "";
  const level = (course?.level || "Beginner").toString();

  const levelPill = useMemo(() => {
    const mapDark = {
      Beginner: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      "Beginner–Intermediate": "bg-sky-500/10 text-sky-300 border-sky-500/20",
      Intermediate: "bg-sky-500/10 text-sky-300 border-sky-500/20",
      "Intermediate–Advanced": "bg-rose-500/10 text-rose-300 border-rose-500/20",
      Advanced: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    };
    const mapLight = {
      Beginner: "bg-emerald-50 text-emerald-800 border-emerald-200",
      "Beginner–Intermediate": "bg-sky-50 text-sky-800 border-sky-200",
      Intermediate: "bg-sky-50 text-sky-800 border-sky-200",
      "Intermediate–Advanced": "bg-rose-50 text-rose-800 border-rose-200",
      Advanced: "bg-rose-50 text-rose-800 border-rose-200",
    };
    const m = theme === "dark" ? mapDark : mapLight;
    return (
      m[level] ??
      (theme === "dark"
        ? "bg-white/5 text-white/80 border-white/10"
        : "bg-slate-50 text-slate-700 border-slate-200")
    );
  }, [level, theme]);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = clamp((px - 0.5) * 12, -8, 8);
    const rx = clamp(-(py - 0.5) * 12, -8, 8);
    setTilt({ rx, ry, gx: px * 100, gy: py * 100 });
  };

  const reset = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 30 });

  const title = pickLang(course?.title, lang, "Untitled Course");
  const tagline =
    pickLang(course?.tagline, lang, "") ||
    pickLang(course?.description, lang, "");

  const duration = pickLang(course?.duration, lang, "—");

  const skills = normalizeStringArray(course?.skills);
  const projects = normalizeStringArray(course?.projects);

  const canOpen = Boolean(courseId);

  // Extract color values based on category accent gradient
  const themeGlow = useMemo(() => {
    if (cat?.accent?.includes("cyan")) return "rgba(6,182,212,0.22)";
    if (cat?.accent?.includes("purple") || cat?.accent?.includes("indigo")) return "rgba(99,102,241,0.22)";
    if (cat?.accent?.includes("emerald")) return "rgba(16,185,129,0.22)";
    return "rgba(56,189,248,0.22)";
  }, [cat]);

  return (
    <motion.button
      layout
      ref={ref}
      type="button"
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={() => {
        if (!canOpen) return;
        nav(`/courses/${encodeURIComponent(courseId)}`);
      }}
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.985 }}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "group relative w-full text-left focus:outline-none",
        !canOpen && "opacity-75 cursor-not-allowed"
      )}
      style={{ transformStyle: "preserve-3d" }}
      aria-disabled={!canOpen}
    >
      {/* 3D Border Glow Wrapper */}
      <div 
        className="relative overflow-hidden rounded-[30px] border p-5 transition-shadow duration-300
          bg-white border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.03)]
          dark:bg-slate-950/75 dark:border-white/5 dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]
          hover:border-slate-300 dark:hover:border-white/12
        "
        style={{
          transform: `perspective(950px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Ambient floating glow orb */}
        <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500/10 to-indigo-500/5 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        
        {/* Cursor tracking Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(280px circle at ${tilt.gx}% ${tilt.gy}%, ${themeGlow}, transparent 55%)`,
          }}
        />

        {/* Accent banner strip */}
        <div className={cn("absolute inset-x-0 top-0 h-[6px] bg-gradient-to-r", cat?.accent)} />

        <div className="relative flex h-full flex-col space-y-4" style={{ transform: "translateZ(20px)" }}>
          
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl shrink-0">{cat?.icon ?? "📘"}</span>
                <h3 className="truncate text-base font-black text-slate-800 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                  {title}
                </h3>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tagline || (lang === "hi" ? "कोर्स विवरण जल्द आएगा" : "Course description will appear here")}
              </p>
            </div>

            <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase", levelPill)}>
              {level}
            </span>
          </div>

          {/* Meta rows */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
            <span className="
              inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] font-black text-slate-600 dark:text-slate-300
              bg-slate-50 border-slate-200/60 dark:bg-white/5 dark:border-white/5
            ">
              <Layers size={12} className="text-slate-400" />
              {gradeLabel || (lang === "hi" ? "क्लास ग्रुप" : "Class Group")}
            </span>

            <span className="
              inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] font-black text-slate-600 dark:text-slate-300
              bg-slate-50 border-slate-200/60 dark:bg-white/5 dark:border-white/5
            ">
              <Clock3 size={12} className="text-slate-400" />
              {duration}
            </span>
          </div>

          {/* Skills Column */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
              {lang === "hi" ? "आप क्या सीखेंगे" : "Skills acquired"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(skills.length ? skills : ["STEM Thinking", "Problem Solving", "Logic Builder"])
                .slice(0, 3)
                .map((s) => (
                  <span
                    key={s}
                    className="
                      rounded-lg border px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400
                      bg-slate-50/50 border-slate-200/50 dark:bg-white/5 dark:border-white/5
                    "
                  >
                    {s}
                  </span>
                ))}
            </div>
          </div>

          {/* Projects details */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
              {lang === "hi" ? "प्रोजेक्ट्स" : "Projects included"}
            </div>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {(projects.length ? projects : [lang === "hi" ? "मिनी प्रोजेक्ट" : "Hands-on Mini project", lang === "hi" ? "कैपस्टोन चैलेंज" : "Capstone Challenge"])
                .slice(0, 2)
                .map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full bg-gradient-to-r", cat?.accent)} />
                    <span className="truncate">{p}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Action button at bottom */}
          <div className="pt-2">
            <div className="
              inline-flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-xs font-black transition duration-300
              bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800
              dark:bg-white/5 dark:border-white/5 dark:text-white/80 dark:hover:bg-white/10
            ">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-500 animate-pulse" />
                {lang === "hi" ? "कोर्स शुरू करें" : "Open Course Explorer"}
              </span>
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </div>
          </div>

        </div>
      </div>
    </motion.button>
  );
}
