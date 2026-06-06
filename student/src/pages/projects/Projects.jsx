// src/pages/projects/Projects.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layers,
  Boxes,
  Cpu,
  CircuitBoard,
  Bot,
  Radio,
  Smartphone,
  Code2,
  Braces,
  Terminal,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  X,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

const ICONS = {
  "3D Printing & Designing": Boxes,
  Electronics: CircuitBoard,
  "Scratch Programming": Layers,
  Robotics: Bot,
  IoT: Radio,
  "App Development": Smartphone,
  "C++": Braces,
  Python: Terminal,
};

const CATEGORY_META = {
  "3D Printing & Designing": {
    id: "3d",
    gradient: "from-blue via-indigo-500 to-fuchsia-500",
    glow: "bg-fuchsia-500/20",
  },
  Electronics: {
    id: "electronics",
    gradient: "from-emerald-400 via-cyan-500 to-sky-500",
    glow: "bg-cyan-500/20",
  },
  "Scratch Programming": {
    id: "scratch",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    glow: "bg-orange-500/20",
  },
  Robotics: {
    id: "robotics",
    gradient: "from-violet-500 via-indigo-500 to-sky-500",
    glow: "bg-violet-500/20",
  },
  IoT: {
    id: "iot",
    gradient: "from-cyan-400 via-sky-500 to-indigo-600",
    glow: "bg-sky-500/20",
  },
  "App Development": {
    id: "appdev",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
    glow: "bg-rose-500/20",
  },
  "C++": {
    id: "cpp",
    gradient: "from-slate-500 via-indigo-600 to-sky-500",
    glow: "bg-indigo-500/20",
  },
  Python: {
    id: "python",
    gradient: "from-lime-400 via-emerald-500 to-cyan-500",
    glow: "bg-emerald-500/20",
  },
};

const DESIRED_ORDER = [
  "3D Printing & Designing",
  "Electronics",
  "Scratch Programming",
  "Robotics",
  "IoT",
  "App Development",
  "C++",
  "Python",
];

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
}

function asLangObj(v, fallbackEn = "—", fallbackHi = "—") {
  if (v && typeof v === "object") {
    return {
      en: v.en ?? fallbackEn,
      hi: v.hi ?? v.en ?? fallbackHi,
    };
  }

  if (typeof v === "string" && v.trim()) {
    return { en: v, hi: v };
  }

  return { en: fallbackEn, hi: fallbackHi };
}

function extractProjects(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") return null;

  const category =
    pick(project, "category", "track", "domain") ?? "Robotics";

  const meta = CATEGORY_META[category] ?? {
    id: String(category).toLowerCase().replace(/\s+/g, "_"),
    gradient: "from-sky-400 via-indigo-500 to-fuchsia-500",
    glow: "bg-sky-500/20",
  };

  const title =
    project?.title && typeof project.title === "object"
      ? {
          en: project.title.en ?? "Untitled",
          hi: project.title.hi ?? project.title.en ?? "Untitled",
        }
      : {
          en: pick(project, "titleEn", "title", "name") ?? "Untitled",
          hi:
            pick(project, "titleHi") ??
            pick(project, "titleEn", "title", "name") ??
            "Untitled",
        };

  const outcomesRaw =
    project?.outcomes ||
    project?.learningOutcomes ||
    [];

  const practiceProjectsRaw =
    project?.projects ||
    project?.practiceProjects ||
    [];

  return {
    id: String(pick(project, "_id", "id") ?? `${category}-${title.en}`),
    title,
    category,
    level: asLangObj(
      pick(project, "level", "levelLabel", "difficulty"),
      "—",
      "—"
    ),
    duration: asLangObj(
      pick(project, "duration", "durationLabel", "time"),
      "—",
      "—"
    ),
    outcomes: Array.isArray(outcomesRaw)
      ? outcomesRaw.map((x) => String(x)).filter(Boolean)
      : [],
    projects: Array.isArray(practiceProjectsRaw)
      ? practiceProjectsRaw.map((x) => String(x)).filter(Boolean)
      : [],
    description: pick(project, "description", "desc", "summary") ?? "",
    tags: Array.isArray(project?.tags) ? project.tags : [],
    videoUrl: pick(
      project,
      "videoUrl",
      "video",
      "lectureUrl",
      "url",
      "videoLink"
    ) ?? "",
    thumbUrl:
      pick(
        project,
        "thumbUrl",
        "thumbnailUrl",
        "posterUrl",
        "imageUrl",
        "thumbnail"
      ) ?? "",
    resourceUrl: pick(project, "resourceUrl", "resource", "resourceLink") ?? "",
    educatorName:
      pick(project, "educatorName", "teacherName", "createdByName") ||
      pick(project?.createdBy, "fullName", "name") ||
      "",
    createdAt: pick(project, "createdAt", "updatedAt") || "",
    gradient: meta.gradient,
    glow: meta.glow,
    filterId: meta.id,
  };
}

async function fetchAssignedStudentProjectsOnly() {
  const res = await api.get("/projects/student");
  const data = res?.data ?? {};
  const items = extractProjects(data);

  return items
    .map(normalizeProject)
    .filter((x) => x && (x.videoUrl || x.title?.en !== "Untitled"));
}

function Kicker({ icon: Icon, label }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "text-[10px] font-extrabold tracking-[0.18em]",
        "bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10",
        "text-slate-900/70 dark:text-white/80"
      )}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <Icon className="w-3.5 h-3.5 opacity-80" />
      <span>{label}</span>
    </div>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
        "border backdrop-blur-md",
        active
          ? "bg-white text-slate-950 border-white shadow-[0_18px_60px_rgba(0,0,0,0.25)] dark:bg-white dark:text-slate-950 dark:border-white"
          : "bg-white/60 text-slate-800 border-black/10 hover:bg-white dark:bg-white/[0.06] dark:text-white/85 dark:border-white/12 dark:hover:bg-white/[0.09]"
      )}
    >
      {children}
    </button>
  );
}

function VideoThumb({ thumbUrl, title, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/12 bg-black/5 dark:bg-white/10">
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-70", gradient)} />
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={title}
          className="relative w-full h-[160px] sm:h-[170px] object-cover opacity-90"
          loading="lazy"
        />
      ) : (
        <div className="relative h-[160px] sm:h-[170px]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="text-xs font-extrabold text-white/90 line-clamp-1">
          {title}
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-white/12 border border-white/15 text-white/90">
          <PlayCircle className="w-3.5 h-3.5" />
          VIDEO
        </div>
      </div>
    </div>
  );
}

function TrackCard({ t, lang, active, onOpen }) {
  const Icon = ICONS[t.category] ?? Sparkles;
  const title = t.title?.[lang] ?? t.title?.en ?? "Untitled";

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "group relative rounded-[26px] overflow-hidden",
        "border border-black/10 dark:border-white/12",
        "shadow-[0_26px_80px_rgba(0,0,0,0.20)]",
        "bg-white/75 dark:bg-[#0B1020]/70 backdrop-blur-xl"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-24 opacity-55 blur-2xl bg-gradient-to-r",
          t.gradient
        )}
      />

      <div className="relative p-5">
        <VideoThumb thumbUrl={t.thumbUrl} title={title} gradient={t.gradient} />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl grid place-items-center shrink-0",
                "bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/12",
                "shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
              )}
            >
              <Icon className="w-6 h-6 text-slate-900/80 dark:text-white/85" />
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-extrabold text-slate-900 dark:text-white line-clamp-1">
                {title}
              </div>

              <div className="mt-0.5 text-[11px] text-slate-600 dark:text-white/65 line-clamp-1">
                {(t.level?.[lang] ?? t.level?.en ?? "—")} •{" "}
                {(t.duration?.[lang] ?? t.duration?.en ?? "—")}
              </div>

              {t.educatorName ? (
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-white/60 line-clamp-1">
                  {lang === "hi" ? "शिक्षक:" : "By:"}{" "}
                  <span className="font-bold">{t.educatorName}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide shrink-0",
              "border border-black/10 dark:border-white/12",
              "bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/75"
            )}
          >
            {lang === "hi" ? "वीडियो" : "VIDEO"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(t.outcomes || []).slice(0, 4).map((x, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2",
                "bg-black/4 dark:bg-white/[0.06] border border-black/8 dark:border-white/10"
              )}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-white/80 line-clamp-1">
                {x}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onOpen}
          className={cn(
            "mt-4 w-full rounded-2xl px-4 py-3 font-extrabold text-sm",
            "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all",
            "dark:bg-white dark:text-slate-950",
            "shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
          )}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {lang === "hi" ? "लेक्चर देखें" : "Watch Lecture"}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {active && (
        <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-2 ring-sky-400/60 dark:ring-sky-300/60" />
      )}
    </motion.div>
  );
}

function isYouTube(url = "") {
  return /youtube\.com|youtu\.be/i.test(url);
}

function toYouTubeEmbed(url = "") {
  const m1 = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  const m3 = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  const id = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

function DetailDrawer({ open, onClose, track, lang }) {
  if (!open || !track) return null;

  const title = track.title?.[lang] ?? track.title?.en ?? "Untitled";
  const level = track.level?.[lang] ?? track.level?.en ?? "—";
  const duration = track.duration?.[lang] ?? track.duration?.en ?? "—";
  const hasVideo = !!track.videoUrl;
  const yt = isYouTube(track.videoUrl);
  const embed = yt ? toYouTubeEmbed(track.videoUrl) : "";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.button
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className={cn(
            "relative w-full max-w-5xl",
            "max-h-[88vh] overflow-hidden",
            "rounded-[26px] sm:rounded-[32px]",
            "border border-white/12 bg-[#0B1020]/88 backdrop-blur-2xl",
            "shadow-[0_30px_120px_rgba(0,0,0,0.60)]"
          )}
        >
          <div
            className={cn(
              "absolute -inset-24 opacity-55 blur-2xl bg-gradient-to-r",
              track.gradient
            )}
          />

          <div className="relative p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-white line-clamp-2">
                  {title}
                </div>

                <div className="mt-1 text-sm text-white/70">
                  {level} • {duration}
                  {track.educatorName ? (
                    <>
                      {" "}
                      • {lang === "hi" ? "शिक्षक:" : "By:"}{" "}
                      <span className="font-extrabold">{track.educatorName}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <button
                onClick={onClose}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                  "bg-white/10 border border-white/12 text-white/90 hover:bg-white/15 transition"
                )}
              >
                <X className="w-4 h-4" />
                {lang === "hi" ? "बंद" : "Close"}
              </button>
            </div>
          </div>

          <div className="relative overflow-y-auto max-h-[calc(88vh-92px)] p-4 sm:p-6">
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <div className="rounded-2xl overflow-hidden border border-white/12 bg-black/30">
                  {hasVideo ? (
                    yt ? (
                      <div className="relative w-full aspect-video">
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={embed}
                          title={title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        className="w-full aspect-video bg-black"
                        controls
                        preload="metadata"
                        poster={track.thumbUrl || undefined}
                        src={track.videoUrl}
                      />
                    )
                  ) : (
                    <div className="aspect-video grid place-items-center text-sm font-extrabold text-white/70">
                      {lang === "hi" ? "वीडियो उपलब्ध नहीं है" : "Video not available"}
                    </div>
                  )}
                </div>

                {track.description ? (
                  <div className="mt-3 rounded-2xl p-4 border border-white/10 bg-white/[0.06]">
                    <div className="text-xs font-extrabold tracking-[0.18em] text-white/65">
                      {lang === "hi" ? "विवरण" : "DESCRIPTION"}
                    </div>
                    <p className="mt-2 text-sm text-white/80 leading-relaxed">
                      {track.description}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.06]">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-white/65">
                    {lang === "hi" ? "लर्निंग आउटकम्स" : "LEARNING OUTCOMES"}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(track.outcomes || []).length ? (
                      track.outcomes.map((x, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400" />
                          <div className="text-sm font-semibold text-white/85">{x}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-white/65">
                        {lang === "hi" ? "आउटकम्स अपडेट होंगे" : "Outcomes will be updated"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.06]">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-white/65">
                    {lang === "hi" ? "प्रैक्टिस प्रोजेक्ट्स" : "PRACTICE PROJECTS"}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {(track.projects || []).length ? (
                      track.projects.map((p, i) => (
                        <div
                          key={i}
                          className="rounded-xl px-3 py-2 border border-white/10 bg-black/20"
                        >
                          <div className="text-sm font-bold text-white/85">{p}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-white/65">
                        {lang === "hi" ? "प्रोजेक्ट्स अपडेट होंगे" : "Projects will be updated"}
                      </div>
                    )}
                  </div>
                </div>

                {(track.resourceUrl || track.videoUrl) && (
                  <div className="flex flex-wrap gap-2">
                    {track.resourceUrl ? (
                      <a
                        href={track.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                          "bg-white/10 border border-white/12 text-white/90 hover:bg-white/15 transition"
                        )}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {lang === "hi" ? "रिसोर्स" : "Resource"}
                      </a>
                    ) : null}

                    {track.videoUrl ? (
                      <a
                        href={track.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                          "bg-white text-slate-950 hover:opacity-95 transition"
                        )}
                      >
                        <PlayCircle className="w-4 h-4" />
                        {lang === "hi" ? "वीडियो खोलें" : "Open Video"}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {(track.tags || []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {(track.tags || []).slice(0, 10).map((tg, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-extrabold px-3 py-1.5 rounded-full bg-white/10 border border-white/12 text-white/80"
                  >
                    {tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SkeletonCard() {
  return (
    <div
      className={cn(
        "relative rounded-[26px] overflow-hidden",
        "border border-black/10 dark:border-white/12",
        "bg-white/75 dark:bg-[#0B1020]/70 backdrop-blur-xl",
        "shadow-[0_26px_80px_rgba(0,0,0,0.20)]"
      )}
    >
      <div className="p-5">
        <div className="h-[160px] sm:h-[170px] rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="mt-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-2/3 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            <div className="mt-2 h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse"
            />
          ))}
        </div>
        <div className="mt-4 h-11 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export default function Projects() {
  const nav = useNavigate();
  const { theme } = useContext(ThemeContext) || { theme: "dark" };
  const { language } = useContext(LanguageContext) || { language: "en" };
  const lang = language || "en";

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [openId, setOpenId] = useState(null);

  const [tracksAll, setTracksAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const items = await fetchAssignedStudentProjectsOnly();
        if (!mounted) return;
        setTracksAll(items);
      } catch (e) {
        if (!mounted) return;
        setTracksAll([]);
        setErr(getApiError?.(e) || e?.message || "Failed to load assigned projects");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    const seen = new Set((tracksAll || []).map((t) => t.category).filter(Boolean));
    const base = DESIRED_ORDER.filter((x) => seen.has(x));
    const extras = Array.from(seen).filter((x) => !DESIRED_ORDER.includes(x));
    const finalCats = (base.length ? base : DESIRED_ORDER).concat(extras);

    return finalCats.map((name) => ({
      name,
      id: CATEGORY_META[name]?.id ?? name.toLowerCase().replace(/\s+/g, "_"),
    }));
  }, [tracksAll]);

  const tracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tracksAll;

    if (active !== "all") {
      list = list.filter((t) => t.filterId === active);
    }

    if (q) {
      list = list.filter((t) => {
        const titleEn = (t.title?.en ?? "").toLowerCase();
        const titleHi = (t.title?.hi ?? "").toLowerCase();
        const cat = (t.category ?? "").toLowerCase();
        const educator = (t.educatorName ?? "").toLowerCase();
        const desc = (t.description ?? "").toLowerCase();
        const tags = (t.tags || []).map((x) => String(x).toLowerCase());

        return (
          titleEn.includes(q) ||
          titleHi.includes(q) ||
          cat.includes(q) ||
          educator.includes(q) ||
          desc.includes(q) ||
          tags.some((x) => x.includes(q)) ||
          (t.outcomes || []).some((x) => String(x).toLowerCase().includes(q)) ||
          (t.projects || []).some((x) => String(x).toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [query, active, tracksAll]);

  const openTrack = useMemo(
    () => tracksAll.find((x) => x.id === openId) || null,
    [openId, tracksAll]
  );

  const totalVideos = useMemo(
    () => tracksAll.filter((t) => !!t.videoUrl).length,
    [tracksAll]
  );

  const backLabel = lang === "hi" ? "वापस" : "Back";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className={cn(
          "absolute inset-0",
          theme === "dark"
            ? "bg-[#070A12]"
            : "bg-[radial-gradient(1100px_500px_at_15%_10%,rgba(56,189,248,0.30),transparent_55%),radial-gradient(900px_480px_at_85%_15%,rgba(168,85,247,0.25),transparent_60%),radial-gradient(900px_520px_at_50%_90%,rgba(34,197,94,0.18),transparent_60%),linear-gradient(180deg,#F8FBFF,#FFFFFF)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-60 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 md:py-10">
        <div className="mb-4 flex items-center justify-start">
          <button
            type="button"
            onClick={() => nav(-1)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl",
              "border border-black/10 dark:border-white/12",
              "text-slate-900 dark:text-white/90 hover:opacity-95 transition",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        </div>

        <div className="text-center">
          <Kicker
            icon={Sparkles}
            label={lang === "hi" ? "असाइन्ड वीडियो प्रोजेक्ट्स" : "ASSIGNED VIDEO PROJECTS"}
          />

          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-[1.12] tracking-tight text-slate-950 dark:text-white">
            {lang === "hi" ? (
              <span className="inline">
                आपका{" "}
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  असाइन्ड प्रोजेक्ट लाइब्रेरी
                </span>
              </span>
            ) : (
              <span className="inline">
                Your{" "}
                <span
                  className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  Assigned Project Library
                </span>
              </span>
            )}
          </h2>

          <p className="mt-3 mx-auto max-w-2xl text-[13px] sm:text-sm text-slate-700/80 dark:text-white/80">
            {lang === "hi"
              ? "यहाँ सिर्फ वही प्रोजेक्ट दिखेंगे जो आपके स्कूल और क्लास को असाइन किए गए हैं।"
              : "Only projects assigned to your school and class will appear here."}
          </p>
        </div>

        <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl px-3 py-2",
              "bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl",
              "border border-black/10 dark:border-white/12",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <Search className="w-4 h-4 text-slate-700 dark:text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "hi"
                  ? "प्रोजेक्ट / ट्रैक / शिक्षक खोजें..."
                  : "Search project / track / educator..."
              }
              className={cn(
                "w-full md:w-[380px] bg-transparent outline-none",
                "text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/45"
              )}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
              <SlidersHorizontal className="w-4 h-4" />
              {lang === "hi" ? "फ़िल्टर" : "FILTER"}
            </span>

            <Chip active={active === "all"} onClick={() => setActive("all")}>
              {lang === "hi" ? "सभी" : "All"}
            </Chip>

            {filters.map((f) => (
              <Chip key={f.id} active={active === f.id} onClick={() => setActive(f.id)}>
                {f.name === "3D Printing & Designing" ? "3D" : f.name}
              </Chip>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={cn(
            "mt-6 rounded-[28px] overflow-hidden",
            "border border-white/10 dark:border-white/12",
            "bg-white/60 dark:bg-white/[0.06] backdrop-blur-2xl",
            "shadow-[0_24px_90px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl p-3 border border-white/10 dark:border-white/12 bg-white/55 dark:bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-900/80 dark:text-white/80" />
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                  {lang === "hi" ? "कुल लेक्चर" : "TOTAL LECTURES"}
                </div>
              </div>
              <div className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                {loading ? "—" : totalVideos}
              </div>
            </div>

            <div className="rounded-2xl p-3 border border-white/10 dark:border-white/12 bg-white/55 dark:bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-900/80 dark:text-white/80" />
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                  {lang === "hi" ? "कुल प्रोजेक्ट्स" : "PROJECTS"}
                </div>
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                {loading ? "Loading..." : tracksAll.length}
              </div>
            </div>

            <div className="rounded-2xl p-3 border border-white/10 dark:border-white/12 bg-white/55 dark:bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-slate-900/80 dark:text-white/80" />
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                  {lang === "hi" ? "फोकस" : "FOCUS"}
                </div>
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                {lang === "hi" ? "केवल असाइन्ड प्रोजेक्ट्स" : "Only Assigned Projects"}
              </div>
            </div>

            <div className="rounded-2xl p-3 border border-white/10 dark:border-white/12 bg-white/55 dark:bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-900/80 dark:text-white/80" />
                <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                  {lang === "hi" ? "यूआई" : "UI"}
                </div>
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                {lang === "hi" ? "स्कूल + क्लास आधारित" : "School + Class Based"}
              </div>
            </div>
          </div>
        </motion.div>

        {!!err && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
              <Sparkles className="w-4 h-4 text-slate-800 dark:text-white/70" />
              <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">
                {lang === "hi" ? "लोड नहीं हुआ:" : "Load failed:"} {err}
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : tracks.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  >
                    <TrackCard
                      t={t}
                      lang={lang}
                      active={openId === t.id}
                      onOpen={() => setOpenId(t.id)}
                    />
                  </motion.div>
                ))}
          </AnimatePresence>
        </motion.div>

        {!loading && tracks.length === 0 && !err && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
              <Sparkles className="w-4 h-4 text-slate-800 dark:text-white/70" />
              <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">
                {lang === "hi"
                  ? "आपके स्कूल/क्लास के लिए कोई प्रोजेक्ट असाइन नहीं है"
                  : "No projects assigned for your school/class"}
              </div>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer
        open={!!openId}
        onClose={() => setOpenId(null)}
        track={openTrack}
        lang={lang}
      />
    </div>
  );
}