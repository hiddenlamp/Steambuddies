// src/pages/courses/CourseDetails.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe2,
  Layers,
  Languages,
  PlayCircle,
  Star,
  Sparkles,
  ShieldCheck,
  Download,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { CATEGORIES, GRADE_GROUPS } from "./courses.data";
import { getCoursePublicApi } from "../../api/courses.api";

const cn = (...s) => s.filter(Boolean).join(" ");
const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));

function gradeLabel(id, lang) {
  const g = GRADE_GROUPS?.find?.((x) => x.id === id);
  return g ? (g.label?.[lang] ?? g.label?.en ?? "Class Group") : "Class Group";
}

/** ✅ Convert various video links to EMBED (YouTube / Vimeo) for iframe */
function toEmbedUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);

    // --- YouTube ---
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;

      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;

      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      return url;
    }

    // --- Vimeo ---
    if (u.hostname.includes("vimeo.com")) {
      if (u.hostname.includes("player.vimeo.com")) return url;
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

/** ✅ normalize videos (handles many backend shapes safely) */
function normalizeVideos(course) {
  const raw =
    course?.videos ??
    course?.videoLectures ??
    course?.lectures ??
    course?.videoUrls ??
    course?.video_links ??
    [];

  if (typeof raw === "string") {
    return [{ title: { en: "Lecture", hi: "लेक्चर" }, url: raw }];
  }

  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw.map((u, idx) => ({
      title: { en: `Lecture ${idx + 1}`, hi: `लेक्चर ${idx + 1}` },
      url: u,
    }));
  }

  if (Array.isArray(raw)) {
    return raw
      .map((v, idx) => {
        const title =
          v?.title ??
          v?.name ??
          (typeof v === "string"
            ? { en: `Lecture ${idx + 1}`, hi: `लेक्चर ${idx + 1}` }
            : { en: `Lecture ${idx + 1}`, hi: `लेक्चर ${idx + 1}` });

        const url =
          v?.url ??
          v?.link ??
          v?.videoUrl ??
          v?.video_url ??
          (typeof v === "string" ? v : "");

        return { ...v, title, url };
      })
      .filter((v) => v && (v.url || v.title));
  }

  return [];
}

/** ✅ includes -> always array of strings */
function normalizeIncludes(course, language) {
  const raw = course?.includes;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const arr = raw?.[language] ?? raw?.en ?? raw?.hi;
    if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
    if (typeof arr === "string") return [arr];
  }

  if (Array.isArray(raw) && raw.every((x) => typeof x === "string" || typeof x === "number")) {
    return raw.map(String).filter(Boolean);
  }

  if (Array.isArray(raw)) {
    const mapped = raw
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string" || typeof item === "number") return String(item);

        const v1 = item?.[language] ?? item?.en ?? item?.hi;
        if (typeof v1 === "string" || typeof v1 === "number") return String(v1);

        const v2 = item?.title?.[language] ?? item?.title?.en ?? item?.title?.hi;
        if (typeof v2 === "string" || typeof v2 === "number") return String(v2);

        return null;
      })
      .filter(Boolean);

    if (mapped.length) return mapped;
  }

  return [
    ...(course?.skills || []).map((s) => `Skill: ${s}`),
    ...(course?.projects || []).slice(0, 6).map((p) => `Project: ${p}`),
  ].slice(0, 12);
}

/** ✅ curriculum safe */
function normalizeCurriculum(course) {
  const raw = course?.curriculum;

  if (Array.isArray(raw) && raw.length) {
    return raw.map((m) => ({
      title: m?.title ?? { en: "Module", hi: "मॉड्यूल" },
      lessons: Array.isArray(m?.lessons)
        ? m.lessons.map((l) => ({
            title:
              l?.title ??
              (typeof l === "string" ? { en: l, hi: l } : { en: l?.en ?? "Lesson", hi: l?.hi ?? "पाठ" }),
          }))
        : [],
    }));
  }

  return [
    { title: { en: "Getting Started", hi: "शुरुआत" }, lessons: [] },
    { title: { en: "Projects", hi: "प्रोजेक्ट्स" }, lessons: [] },
  ];
}

function normalizeCourse(c) {
  if (!c) return null;
  const videos = normalizeVideos(c);

  const meta = {
    ...(c.meta || {}),
    lectures:
      typeof c?.meta?.lectures === "number"
        ? c.meta.lectures
        : Array.isArray(videos)
        ? videos.length
        : 0,
    language: c?.meta?.language || ["en", "hi"],
    rating: c?.meta?.rating ?? 4.7,
    durationMinutes: c?.meta?.durationMinutes ?? c?.durationMinutes ?? c?.duration ?? null,
    level: c?.meta?.level ?? c?.level ?? null, // e.g. Beginner/Intermediate
    updatedAt: c?.meta?.updatedAt ?? c?.updatedAt ?? null,
    certificate: c?.meta?.certificate ?? c?.certificate ?? false,
  };

  return { ...c, id: c.id || c._id, videos, meta };
}

function fmtMinutes(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!m) return "—";
  if (!h) return `${r}m`;
  if (!r) return `${h}h`;
  return `${h}h ${r}m`;
}

function safeDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
}

/** ✅ fallback gradient background pattern */
function BgOrbs({ accent = "from-sky-500 via-indigo-500 to-fuchsia-500", theme = "light" }) {
  const soft = theme === "dark" ? "opacity-35" : "opacity-60";
  const blur = theme === "dark" ? "blur-3xl" : "blur-2xl";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute -top-28 -left-24 h-72 w-72 rounded-full bg-gradient-to-r", accent, blur, soft)} />
      <div className={cn("absolute top-20 -right-24 h-80 w-80 rounded-full bg-gradient-to-r", accent, blur, soft)} />
      <div className={cn("absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-r", accent, blur, "opacity-30")} />
      <div className={cn("absolute inset-0", theme === "dark" ? "bg-slate-950/40" : "bg-white/10")} />
      <div className={cn("absolute inset-0", theme === "dark" ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,.08),transparent_55%)]" : "bg-[radial-gradient(circle_at_top,rgba(2,132,199,.10),transparent_55%)]")} />
    </div>
  );
}

function StatPill({ icon: Icon, label, value, sub, glass, muted, accent }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", glass)}>
      <div className={cn("grid h-10 w-10 place-items-center rounded-2xl border", glass)}>
        <Icon className={cn("h-5 w-5")} />
      </div>
      <div className="min-w-0">
        <div className={cn("text-xs font-semibold", muted)}>{label}</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <div className={cn("truncate text-sm font-semibold md:text-base")}>
            <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", accent)}>{value}</span>
          </div>
          {sub ? <div className={cn("truncate text-xs", muted)}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, glass }) {
  return <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", glass)}>{children}</span>;
}

function EmptyState({ title, hint, glass, muted, onBack, language }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm underline">
          <ArrowLeft className="h-4 w-4" /> {language === "hi" ? "वापस" : "Back"}
        </button>

        <div className={cn("mt-6 rounded-3xl border p-6 md:p-8", glass)}>
          <div className="flex items-start gap-4">
            <div className={cn("grid h-12 w-12 place-items-center rounded-2xl border", glass)}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{title}</div>
              <div className={cn("mt-2 text-sm", muted)}>{hint}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetails() {
  const nav = useNavigate();
  const { courseId } = useParams();

  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const { language = "en" } = useContext(LanguageContext) || {};

  const decodedId = decodeURIComponent(courseId || "");

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [netErr, setNetErr] = useState("");

  const tabsRef = useRef(null);

  // ✅ Fetch
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setNetErr("");
        setLoading(true);

        const res = await getCoursePublicApi(decodedId);

        const c = res?.data?.course ?? res?.data?.data ?? res?.data;

        if (!alive) return;
        setCourse(normalizeCourse(c));
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Network error while loading course";
        if (!alive) return;
        setNetErr(msg);
        setCourse(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [decodedId]);

  // ✅ category
  const cat = useMemo(() => {
    const found = CATEGORIES?.find?.((c) => c.id === course?.category);
    return (
      found ||
      CATEGORIES?.[0] || {
        icon: "📘",
        name: { en: "Course", hi: "कोर्स" },
        accent: "from-sky-500 via-indigo-500 to-fuchsia-500",
      }
    );
  }, [course]);

  const pageBase =
    theme === "dark"
      ? "bg-slate-950 text-white"
      : "bg-gradient-to-b from-sky-50 via-white to-fuchsia-50 text-slate-900";

  const glass =
    theme === "dark"
      ? "border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_28px_70px_-28px_rgba(0,0,0,.8)]"
      : "border-white/60 bg-white/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.65),0_24px_60px_-28px_rgba(99,102,241,.35)]";

  const glassSoft =
    theme === "dark"
      ? "border-white/10 bg-white/[0.03] backdrop-blur-xl"
      : "border-white/60 bg-white/60 backdrop-blur-xl";

  const muted = theme === "dark" ? "text-white/70" : "text-slate-600";
  const muted2 = theme === "dark" ? "text-white/55" : "text-slate-500";
  const accent = cat?.accent || "from-sky-500 via-indigo-500 to-fuchsia-500";

  // ✅ Derived data
  const title = course?.title?.[language] ?? course?.title ?? "Course";
  const desc = course?.description?.[language] ?? course?.description ?? "";
  const includes = course ? normalizeIncludes(course, language) : [];
  const curriculum = course ? normalizeCurriculum(course) : [];
  const meta = course?.meta || { lectures: 0, language: ["en", "hi"], rating: 4.7 };
  const rating = Number(meta?.rating ?? 4.7);
  const ratingPct = clamp((rating / 5) * 100, 0, 100);

  const skills = Array.isArray(course?.skills) ? course.skills : [];
  const projects = Array.isArray(course?.projects) ? course.projects : [];

  const lessonsCount = useMemo(() => {
    const total = (curriculum || []).reduce((acc, m) => acc + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);
    return total;
  }, [curriculum]);

  // State
  const [tab, setTab] = useState("overview");
  const [openModule, setOpenModule] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    // reset when course changes
    setTab("overview");
    setOpenModule(0);
    setVideoIndex(0);
  }, [course?.id]);

  const videos = Array.isArray(course?.videos) ? course.videos : [];
  const activeVideo = videos?.[videoIndex] || null;
  const activeVideoTitle =
    activeVideo?.title?.[language] ?? activeVideo?.title?.en ?? activeVideo?.title ?? (language === "hi" ? "लेक्चर" : "Lecture");
  const activeVideoUrl = activeVideo?.url || "";
  const activeEmbed = toEmbedUrl(activeVideoUrl);

  const onStartLearning = () => {
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTab(videos?.length ? "videos" : "curriculum");
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className={cn("min-h-screen", pageBase)}>
        <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-8">
          <div className={cn("relative overflow-hidden rounded-3xl border p-6 md:p-10", glass)}>
            <BgOrbs accent={accent} theme={theme} />
            <div className="relative z-10 animate-pulse">
              <div className="h-6 w-52 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-4 h-11 w-3/4 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-3 h-4 w-full rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-11/12 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10" />
              </div>
              <div className="mt-6 h-11 w-48 rounded-2xl bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Error / Not found UI
  if (!course) {
    return (
      <div className={cn("min-h-screen", pageBase)}>
        <EmptyState
          language={language}
          glass={glass}
          muted={muted}
          onBack={() => nav("/courses")}
          title={language === "hi" ? "Course नहीं मिला" : "Course not found"}
          hint={
            <span>
              {language === "hi" ? "ID:" : "ID:"} <span className="font-semibold">{decodedId}</span>
              {netErr ? <span className="block mt-2">Error: {netErr}</span> : null}
            </span>
          }
        />
      </div>
    );
  }

  const Tabs = [
    { id: "overview", label: language === "hi" ? "Overview" : "Overview" },
    { id: "curriculum", label: language === "hi" ? "Modules" : "Modules" },
    { id: "videos", label: language === "hi" ? "Videos" : "Videos" },
  ];

  // Use a dynamic “hero image” if your backend has one
  const heroImage =
    course?.thumbnailUrl ||
    course?.thumbnail ||
    course?.image ||
    course?.bannerUrl ||
    course?.banner ||
    ""; // if empty, we show elegant placeholder

  return (
    <div className={cn("min-h-screen", pageBase)}>
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pt-8">
        {/* Top Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nav("/courses")}
            className={cn("inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm", glass)}
          >
            <ArrowLeft className="h-4 w-4" />
            {language === "hi" ? "Courses" : "Courses"}
          </motion.button>

          <div className="flex flex-wrap items-center gap-2">
            <Chip glass={glass}>
              <span className="text-base">{cat.icon}</span>
              <span className="font-medium">{cat.name?.[language] ?? cat.name?.en ?? cat.name}</span>
            </Chip>

            <Chip glass={glass}>
              <BadgeCheck className="h-4 w-4" />
              <span className={cn("font-medium", muted)}>{gradeLabel(course.gradeGroup, language)}</span>
            </Chip>
          </div>
        </div>

        {/* HERO */}
        <section className={cn("relative overflow-hidden rounded-3xl border", glass)}>
          <BgOrbs accent={accent} theme={theme} />

          <div className="relative z-10 grid gap-6 p-6 md:p-10 lg:grid-cols-[1.2fr_.8fr]">
            {/* Left: Title + Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip glass={glassSoft}>
                  <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-r", accent)} />
                  <span className={cn("text-xs font-semibold", muted)}>
                    {language === "hi" ? "Live Course" : "Live Course"}
                  </span>
                </Chip>

                {meta?.level ? (
                  <Chip glass={glassSoft}>
                    <Sparkles className="h-4 w-4" />
                    <span className={cn("text-xs font-semibold", muted)}>{meta.level}</span>
                  </Chip>
                ) : null}

                {meta?.certificate ? (
                  <Chip glass={glassSoft}>
                    <ShieldCheck className="h-4 w-4" />
                    <span className={cn("text-xs font-semibold", muted)}>
                      {language === "hi" ? "Certificate" : "Certificate"}
                    </span>
                  </Chip>
                ) : null}
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
                <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", accent)}>{title}</span>
              </h1>

              <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed md:text-base", muted)}>
                {desc || (language === "hi" ? "Course description जल्द add होगा." : "Course description will be added soon.")}
              </p>

              {/* Stats */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatPill
                  icon={Layers}
                  label={language === "hi" ? "Lectures" : "Lectures"}
                  value={`${meta.lectures ?? 0}`}
                  sub={lessonsCount ? `${lessonsCount} lessons` : ""}
                  glass={glassSoft}
                  muted={muted2}
                  accent={accent}
                />
                <StatPill
                  icon={Languages}
                  label={language === "hi" ? "Languages" : "Languages"}
                  value={(meta.language || []).join(", ").toUpperCase()}
                  glass={glassSoft}
                  muted={muted2}
                  accent={accent}
                />
                <StatPill
                  icon={Star}
                  label={language === "hi" ? "Rating" : "Rating"}
                  value={`${(Number.isFinite(rating) ? rating : 4.7).toFixed(1)}/5`}
                  sub={language === "hi" ? "Learners love it" : "Learners love it"}
                  glass={glassSoft}
                  muted={muted2}
                  accent={accent}
                />
              </div>

              {/* CTA Row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartLearning}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    theme === "dark"
                      ? "bg-white text-slate-900 hover:bg-white/90"
                      : "bg-slate-900 text-white hover:opacity-95 shadow-lg"
                  )}
                >
                  <PlayCircle className="h-4 w-4" />
                  {language === "hi" ? "Start Learning" : "Start Learning"}
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => tabsRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold", glassSoft)}
                >
                  <BookOpen className="h-4 w-4" />
                  {language === "hi" ? "View Modules" : "View Modules"}
                </motion.button>

                {!!activeVideoUrl && (
                  <a
                    className={cn("inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold", glassSoft)}
                    href={activeVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={language === "hi" ? "Open video link" : "Open video link"}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {language === "hi" ? "Open Link" : "Open Link"}
                  </a>
                )}
              </div>

              {/* Micro meta row */}
              <div className={cn("mt-5 flex flex-wrap items-center gap-3 text-xs", muted2)}>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {meta?.durationMinutes ? fmtMinutes(meta.durationMinutes) : "—"}
                </span>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  {language === "hi" ? "Online" : "Online"}
                </span>
                {meta?.updatedAt ? (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {language === "hi" ? "Updated" : "Updated"}: {safeDate(meta.updatedAt)}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Rating bar */}
              <div className={cn("mt-4 rounded-2xl border p-4", glassSoft)}>
                <div className="flex items-center justify-between gap-3">
                  <div className={cn("text-xs font-semibold", muted2)}>
                    {language === "hi" ? "Satisfaction" : "Satisfaction"}
                  </div>
                  <div className={cn("text-xs font-semibold", muted2)}>{Math.round(ratingPct)}%</div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratingPct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    className={cn("h-full rounded-full bg-gradient-to-r", accent)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Hero Card / Preview */}
            <div className="space-y-4">
              <div className={cn("relative overflow-hidden rounded-3xl border", glassSoft)}>
                <div className="relative aspect-video w-full overflow-hidden">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <div className={cn("absolute inset-0 bg-gradient-to-r", accent, theme === "dark" ? "opacity-35" : "opacity-25")} />
                      <div className={cn("absolute inset-0", theme === "dark" ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,.10),transparent_55%)]" : "bg-[radial-gradient(circle_at_top,rgba(2,132,199,.12),transparent_55%)]")} />
                      <div className="absolute inset-0 grid place-items-center p-6">
                        <div className={cn("rounded-2xl border px-4 py-3 text-center", glass)}>
                          <div className="text-sm font-semibold">{language === "hi" ? "Preview" : "Preview"}</div>
                          <div className={cn("mt-1 text-xs", muted2)}>
                            {language === "hi" ? "Thumbnail उपलब्ध नहीं है" : "No thumbnail available"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* overlay badge */}
                  <div className="absolute left-4 top-4">
                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", glass)}>
                      <PlayCircle className="h-4 w-4" />
                      <span className={cn("font-semibold", muted)}>
                        {videos?.length ? `${videos.length} videos` : language === "hi" ? "No videos" : "No videos"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cn("text-xs font-semibold", muted2)}>{language === "hi" ? "Next up" : "Next up"}</div>
                      <div className="truncate text-sm font-semibold">{activeVideoTitle}</div>
                    </div>

                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartLearning}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
                        theme === "dark"
                          ? "bg-white text-slate-900 hover:bg-white/90"
                          : "bg-slate-900 text-white hover:opacity-95 shadow"
                      )}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {language === "hi" ? "Play" : "Play"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={cn("rounded-3xl border p-4", glassSoft)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", glass)}>
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{language === "hi" ? "Resources" : "Resources"}</div>
                      <div className={cn("text-xs", muted2)}>
                        {language === "hi" ? "Notes / files (optional)" : "Notes / files (optional)"}
                      </div>
                    </div>
                  </div>
                  <div className={cn("mt-3 text-xs", muted)}>
                    {language === "hi"
                      ? "Backend से resources आएंगे तो यहाँ दिखेंगे."
                      : "If backend provides resources, they will appear here."}
                  </div>
                </div>

                <div className={cn("rounded-3xl border p-4", glassSoft)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", glass)}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{language === "hi" ? "Support" : "Support"}</div>
                      <div className={cn("text-xs", muted2)}>
                        {language === "hi" ? "Help & guidance" : "Help & guidance"}
                      </div>
                    </div>
                  </div>
                  <div className={cn("mt-3 text-xs", muted)}>
                    {language === "hi"
                      ? "FAQ / support link add कर सकते हैं."
                      : "You can add FAQ / support link here."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TABS */}
        <section ref={tabsRef} id="course-tabs" className="mt-8">
          <div className={cn("sticky top-2 z-20 rounded-2xl border p-2", glass)}>
            <div className="flex flex-wrap gap-2">
              {Tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative rounded-xl px-4 py-2 text-sm font-semibold transition",
                    tab === t.id
                      ? theme === "dark"
                        ? "bg-white text-slate-900"
                        : "bg-slate-900 text-white shadow"
                      : theme === "dark"
                      ? "text-white/70 hover:bg-white/10"
                      : "text-slate-600 hover:bg-white/70"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            {/* Left panel */}
            <div className={cn("rounded-3xl border p-5 md:p-6", glass)}>
              <AnimatePresence mode="wait">
                {/* OVERVIEW */}
                {tab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{language === "hi" ? "About Course" : "About Course"}</h2>
                        <p className={cn("mt-2 text-sm leading-relaxed md:text-base", muted)}>
                          {desc || (language === "hi" ? "Description अभी add नहीं है." : "Description is not added yet.")}
                        </p>
                      </div>

                      <div className={cn("hidden sm:block rounded-2xl border p-3", glassSoft)}>
                        <div className={cn("text-xs font-semibold", muted2)}>
                          {language === "hi" ? "Course includes" : "Course includes"}
                        </div>
                        <div className={cn("mt-1 text-sm font-semibold", muted)}>{includes.length} items</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className={cn("text-xs font-semibold", muted2)}>
                        {language === "hi" ? "This Course Includes" : "This Course Includes"}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(includes || []).slice(0, 12).map((t, i) => (
                          <div key={i} className={cn("flex items-start gap-2 rounded-2xl border p-3", glassSoft)}>
                            <CheckCircle2 className="mt-0.5 h-4 w-4" />
                            <span className={cn("text-sm", muted)}>{t}</span>
                          </div>
                        ))}
                      </div>

                      {includes.length > 12 ? (
                        <div className={cn("mt-3 text-xs", muted2)}>
                          {language === "hi" ? "और भी items हैं…" : "More items available…"}
                        </div>
                      ) : null}
                    </div>

                    {!!projects.length && (
                      <div className="mt-6">
                        <div className={cn("text-xs font-semibold", muted2)}>
                          {language === "hi" ? "Projects" : "Projects"}
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {projects.slice(0, 6).map((p, i) => (
                            <div key={i} className={cn("rounded-2xl border p-3 text-sm", glassSoft)}>
                              <span className={cn("font-semibold", muted)}>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* CURRICULUM */}
                {tab === "curriculum" && (
                  <motion.div
                    key="curriculum"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{language === "hi" ? "Course Modules" : "Course Modules"}</h2>
                        <div className={cn("mt-2 text-sm", muted)}>
                          {(curriculum || []).length} {language === "hi" ? "modules" : "modules"} • {lessonsCount}{" "}
                          {language === "hi" ? "lessons" : "lessons"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {(curriculum || []).map((m, idx) => {
                        const open = openModule === idx;
                        const moduleTitle = m?.title?.[language] ?? m?.title?.en ?? "Module";
                        const lessons = Array.isArray(m?.lessons) ? m.lessons : [];

                        return (
                          <div key={idx} className={cn("overflow-hidden rounded-2xl border", glassSoft)}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                              onClick={() => setOpenModule(open ? -1 : idx)}
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn("grid h-10 w-10 place-items-center rounded-2xl border", glass)}>
                                  <BookOpen className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{moduleTitle}</div>
                                  <div className={cn("text-xs", muted2)}>{lessons.length} lessons</div>
                                </div>
                              </div>

                              <ChevronDown className={cn("h-5 w-5 transition", open ? "rotate-180" : "rotate-0")} />
                            </button>

                            <AnimatePresence initial={false}>
                              {open && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-5">
                                    <div className={cn("rounded-2xl border p-4", glass)}>
                                      {lessons.length ? (
                                        <ul className={cn("space-y-2 text-sm md:text-base", muted)}>
                                          {lessons.map((l, i) => {
                                            const lt = l?.title?.[language] ?? l?.title?.en ?? l?.title ?? "Lesson";
                                            return (
                                              <li key={i} className="flex items-start gap-2">
                                                <span className={cn("mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r", accent)} />
                                                <span>{lt}</span>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      ) : (
                                        <div className={cn("text-sm", muted)}>
                                          {language === "hi" ? "Lessons अभी add नहीं हैं." : "Lessons not added yet."}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* VIDEOS */}
                {tab === "videos" && (
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{language === "hi" ? "Video Lectures" : "Video Lectures"}</h2>
                        <div className={cn("mt-1 text-sm", muted)}>
                          {videos.length ? `${videos.length} videos` : language === "hi" ? "No videos" : "No videos"}
                        </div>
                      </div>

                      {videos.length ? (
                        <div className={cn("rounded-2xl border p-2", glassSoft)}>
                          <div className={cn("text-xs font-semibold", muted2)}>
                            {language === "hi" ? "Now Playing" : "Now Playing"}
                          </div>
                          <div className="max-w-[260px] truncate text-sm font-semibold">{activeVideoTitle}</div>
                        </div>
                      ) : null}
                    </div>

                    {!videos.length ? (
                      <div className={cn("mt-4 rounded-2xl border p-4 text-sm", glassSoft, muted)}>
                        {language === "hi" ? "Abhi videos add nahi hue." : "No videos added yet."}
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
                        {/* Player */}
                        <div className={cn("rounded-3xl border p-4", glassSoft)}>
                          {!activeVideoUrl ? (
                            <div className={cn("rounded-2xl border p-4 text-sm", glass, muted)}>
                              {language === "hi" ? "Video URL missing hai." : "Video URL is missing."}
                            </div>
                          ) : (
                            <>
                              <div className="aspect-video overflow-hidden rounded-2xl border">
                                <iframe
                                  className="h-full w-full"
                                  src={activeEmbed}
                                  title={`video-${videoIndex}`}
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>

                              {!!activeVideoUrl && activeVideoUrl !== activeEmbed && (
                                <div className={cn("mt-2 text-xs", muted2)}>(Converted to embed for playback)</div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Playlist */}
                        <div className={cn("rounded-3xl border p-4", glassSoft)}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">{language === "hi" ? "Playlist" : "Playlist"}</div>
                            <div className={cn("text-xs", muted2)}>{videoIndex + 1} / {videos.length}</div>
                          </div>

                          <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
                            {videos.map((v, i) => {
                              const t =
                                v?.title?.[language] ?? v?.title?.en ?? v?.title ?? `${language === "hi" ? "लेक्चर" : "Lecture"} ${i + 1}`;
                              const rawUrl = v?.url || "";
                              const active = i === videoIndex;

                              return (
                                <button
                                  key={i}
                                  onClick={() => setVideoIndex(i)}
                                  className={cn(
                                    "w-full rounded-2xl border p-3 text-left transition",
                                    active
                                      ? theme === "dark"
                                        ? "bg-white text-slate-900"
                                        : "bg-slate-900 text-white shadow"
                                      : cn(glass, theme === "dark" ? "hover:bg-white/10" : "hover:bg-white/80")
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border",
                                        active ? (theme === "dark" ? "border-white/20 bg-white/10" : "border-white/30 bg-white/10") : glassSoft
                                      )}
                                    >
                                      <PlayCircle className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className={cn("truncate text-sm font-semibold", active ? "" : theme === "dark" ? "text-white" : "text-slate-900")}>
                                        {t}
                                      </div>
                                      <div className={cn("mt-1 truncate text-xs", active ? (theme === "dark" ? "text-slate-700" : "text-white/80") : muted2)}>
                                        {rawUrl ? rawUrl : language === "hi" ? "URL missing" : "URL missing"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right panel: Skills + Quick summary */}
            <aside className="space-y-6">
              <div className={cn("rounded-3xl border p-6", glass)}>
                <h3 className="text-lg font-semibold">{language === "hi" ? "Skills Snapshot" : "Skills Snapshot"}</h3>

                {skills.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.slice(0, 18).map((s) => (
                      <motion.span
                        whileHover={{ y: -2 }}
                        key={s}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          theme === "dark"
                            ? "border-white/10 bg-white/5 text-white/80"
                            : "border-white/60 bg-white/70 text-slate-700 shadow-sm"
                        )}
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <div className={cn("mt-3 text-sm", muted)}>{language === "hi" ? "Skills add नहीं हैं." : "No skills added yet."}</div>
                )}
              </div>

              <div className={cn("rounded-3xl border p-6", glass)}>
                <h3 className="text-lg font-semibold">{language === "hi" ? "Quick Summary" : "Quick Summary"}</h3>

                <div className="mt-4 grid gap-3">
                  <div className={cn("rounded-2xl border p-4", glassSoft)}>
                    <div className={cn("text-xs font-semibold", muted2)}>{language === "hi" ? "Modules" : "Modules"}</div>
                    <div className="mt-1 text-sm font-semibold">{(curriculum || []).length}</div>
                  </div>

                  <div className={cn("rounded-2xl border p-4", glassSoft)}>
                    <div className={cn("text-xs font-semibold", muted2)}>{language === "hi" ? "Lessons" : "Lessons"}</div>
                    <div className="mt-1 text-sm font-semibold">{lessonsCount}</div>
                  </div>

                  <div className={cn("rounded-2xl border p-4", glassSoft)}>
                    <div className={cn("text-xs font-semibold", muted2)}>{language === "hi" ? "Videos" : "Videos"}</div>
                    <div className="mt-1 text-sm font-semibold">{videos.length}</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
