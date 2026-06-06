// src/pages/quest/Quest.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock3,
} from "lucide-react";

import {
  feedActivitiesApi,
  likeActivityApi,
  seenActivityApi,
} from "../../api/activities.api";

const cn = (...s) => s.filter(Boolean).join(" ");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const secondsToLabel = (sec) => (sec >= 60 ? `${Math.round(sec / 60)}m` : `${sec}s`);

const STORY_BG = [
  "linear-gradient(135deg,#38BDF8 0%, #818CF8 45%, #F472B6 100%)",
  "linear-gradient(135deg,#22C55E 0%, #38BDF8 45%, #6366F1 100%)",
  "linear-gradient(135deg,#F59E0B 0%, #F472B6 45%, #6366F1 100%)",
];

// {en,hi} OR string => safe text
function pickLangText(val, lang = "en") {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return String(val?.[lang] ?? val?.en ?? val?.hi ?? "");
  return String(val);
}

function isAbsUrl(u) {
  return /^https?:\/\//i.test(String(u || ""));
}

function toOrigin(base) {
  const b = String(base || "").replace(/\/+$/, "");
  return b.endsWith("/api") ? b.slice(0, -4) : b;
}

// ✅ normalize id (_id / id / activityId)
function normalizeId(a) {
  return a?._id || a?.id || a?.activityId || "";
}

export default function Quest() {
  const nav = useNavigate();
  const [language] = useState(() => (localStorage.getItem("hl_lang") || "en").toLowerCase());

  const [stories, setStories] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [active, setActive] = useState(0);
  const story = stories?.[active];

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // liked map by id
  const [liked, setLiked] = useState({});

  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);

  const seenSentRef = useRef(new Set());
  const [mediaBroken, setMediaBroken] = useState(false);
  const brokenTimerRef = useRef(null);

  const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
  const API_ORIGIN = toOrigin(API_BASE);

  const storyId = useMemo(() => normalizeId(story), [story]);

  const mediaSrc = useMemo(() => {
    const raw = story?.src ?? story?.fileUrl ?? story?.mediaUrl ?? story?.url ?? "";
    const src = raw ? String(raw) : "";
    if (!src) return "";
    if (isAbsUrl(src)) return src;
    if (src.startsWith("/")) return `${API_ORIGIN}${src}`;
    return `${API_ORIGIN}/${src}`;
  }, [story, API_ORIGIN]);

  const resetPlayer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (brokenTimerRef.current) {
      clearTimeout(brokenTimerRef.current);
      brokenTimerRef.current = null;
    }

    setProgress(0);
    startedAtRef.current = performance.now();
    pausedAtRef.current = 0;
    setVideoReady(false);
    setMediaBroken(false);

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  const next = () =>
    setActive((i) => {
      if (!stories?.length) return 0;
      return (i + 1) % stories.length;
    });

  const prev = () =>
    setActive((i) => {
      if (!stories?.length) return 0;
      return (i - 1 + stories.length) % stories.length;
    });

  // ✅ Load feed (FIXED res shape)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingFeed(true);
        setFeedError("");

        // axios interceptor => returns data directly
        const data = await feedActivitiesApi();

        // handle multiple shapes safely
        const list =
          data?.activities ||
          data?.data?.activities ||
          data?.items ||
          data?.data?.items ||
          [];

        if (!mounted) return;

        const arr = Array.isArray(list) ? list : [];
        setStories(arr);
        setActive(0);

        // liked map
        const likeMap = Object.fromEntries(
          arr.map((s) => [normalizeId(s), !!s?.my?.liked])
        );
        setLiked(likeMap);
      } catch (e) {
        if (!mounted) return;
        setStories([]);
        setFeedError(
          e?.response?.data?.message || e?.message || "Failed to load activities"
        );
      } finally {
        if (mounted) setLoadingFeed(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // story change
  useEffect(() => {
    if (!storyId) return;

    resetPlayer();
    startedAtRef.current = performance.now();

    if (story?.type === "video") {
      setTimeout(() => {
        if (videoRef.current && !isPaused) videoRef.current.play().catch(() => {});
      }, 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, storyId]);

  // ✅ seen (FIXED id)
  useEffect(() => {
    if (!storyId) return;
    if (seenSentRef.current.has(storyId)) return;

    seenSentRef.current.add(storyId);
    seenActivityApi(storyId).catch(() => {});
  }, [storyId]);

  // if media broken -> auto next
  useEffect(() => {
    if (!mediaBroken) return;

    if (brokenTimerRef.current) clearTimeout(brokenTimerRef.current);
    brokenTimerRef.current = setTimeout(() => next(), 800);

    return () => {
      if (brokenTimerRef.current) {
        clearTimeout(brokenTimerRef.current);
        brokenTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaBroken, storyId]);

  // progress loop
  useEffect(() => {
    if (!storyId) return;

    const durMs = clamp((Number(story?.durationSec) || 12) * 1000, 1200, 60000);

    const tick = (now) => {
      if (isPaused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (mediaBroken) {
        setProgress(1);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (story?.type === "video" && videoRef.current && videoReady) {
        const v = videoRef.current;
        const d = v.duration || Number(story?.durationSec) || 12;
        const p = d ? v.currentTime / d : 0;

        setProgress(clamp(p, 0, 1));
        if (p >= 0.999) next();

        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const start = startedAtRef.current || now;
      const elapsed = now - start;
      const p = elapsed / durMs;

      setProgress(clamp(p, 0, 1));
      if (p >= 1) {
        next();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, isPaused, videoReady, mediaBroken, stories.length]);

  const pause = () => {
    setIsPaused(true);
    pausedAtRef.current = performance.now();
    if (videoRef.current) videoRef.current.pause();
  };

  const resume = () => {
    setIsPaused(false);
    const now = performance.now();
    if (pausedAtRef.current && startedAtRef.current) startedAtRef.current += now - pausedAtRef.current;
    pausedAtRef.current = 0;
    if (videoRef.current && story?.type === "video") videoRef.current.play().catch(() => {});
  };

  const onPress = () => pause();
  const onRelease = () => resume();

  // ✅ Like (FIXED res shape + id)
  const toggleLike = async () => {
    if (!storyId) return;

    const before = !!liked[storyId];
    setLiked((p) => ({ ...p, [storyId]: !before }));

    try {
      const data = await likeActivityApi(storyId);

      const nowLiked =
        data?.liked !== undefined
          ? !!data.liked
          : !!data?.data?.liked;

      const stats =
        data?.stats ||
        data?.data?.stats;

      setLiked((p) => ({ ...p, [storyId]: nowLiked }));

      if (stats) {
        setStories((prev) =>
          prev.map((it) =>
            normalizeId(it) === storyId
              ? { ...it, stats: { ...(it.stats || {}), ...stats } }
              : it
          )
        );
      }
    } catch {
      setLiked((p) => ({ ...p, [storyId]: before }));
    }
  };

  // ===== UI states =====
  if (loadingFeed) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="text-center">
          <div className="text-[12px] font-extrabold tracking-[0.18em] uppercase opacity-70">Loading</div>
          <div className="mt-2 text-[14px] font-black">Fetching today’s activities…</div>
        </div>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-6">
        <div className="max-w-md text-center">
          <div className="text-[12px] font-extrabold tracking-[0.18em] uppercase text-red-500">Error</div>
          <div className="mt-2 text-[14px] font-black">{feedError}</div>
          <div className="mt-3 text-[12px] opacity-70">
            API_ORIGIN: <span className="font-mono">{API_ORIGIN}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-6">
        <div className="max-w-md text-center">
          <div className="text-[12px] font-extrabold tracking-[0.18em] uppercase opacity-70">No Activities</div>
          <div className="mt-2 text-[14px] font-black">Educator has not posted yet.</div>
          <button
            onClick={() => nav(-1)}
            className="mt-4 rounded-2xl px-4 py-2 text-[13px] font-black bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const titleText = pickLangText(story?.title, language);
  const captionText = pickLangText(story?.caption, language);
  const badgeText = pickLangText(story?.badge, language) || "STEAM";
  const educatorName = String(story?.educator?.name || "Educator");
  const educatorId = String(story?.educator?.id || "@educator");

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white pb-[96px]">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-80 dark:opacity-90"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, rgba(56,189,248,0.22), transparent 52%), radial-gradient(circle at 85% 20%, rgba(236,72,153,0.18), transparent 55%), radial-gradient(circle at 45% 110%, rgba(99,102,241,0.18), transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 min-h-[100svh] flex flex-col">
        {/* Top bar */}
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 pt-3 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              onClick={() => nav(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur grid place-items-center"
              aria-label="Back"
              title="Back"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[10px] font-extrabold tracking-[0.18em]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {language === "hi" ? "डेली क्वेस्ट" : "DAILY QUEST"}
              </div>
              <p className="text-[11px] mt-1 truncate text-slate-700/80 dark:text-white/70">
                {language === "hi" ? "होल्ड = पॉज़ • एरो = आगे/पीछे" : "Hold = pause • Arrows = next/prev"}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur">
            <span className="text-[11px] font-extrabold text-slate-900/80 dark:text-white/85">
              {language === "hi" ? "स्टूडेंट व्यू" : "Student View"}
            </span>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-5 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative w-full max-w-[980px] rounded-[26px] sm:rounded-[34px] overflow-hidden border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl"
            style={{ height: "min(calc(100svh - 140px), 820px)" }}
            onMouseDown={onPress}
            onMouseUp={onRelease}
            onMouseLeave={onRelease}
            onTouchStart={onPress}
            onTouchEnd={onRelease}
          >
            {/* Progress */}
            <div className="absolute top-0 left-0 right-0 z-30 p-3">
              <div className="flex gap-1.5">
                {stories.map((s, i) => {
                  const sid = normalizeId(s);
                  const done = i < active;
                  const cur = i === active;
                  return (
                    <div key={sid} className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-black/70 dark:bg-white/90"
                        initial={{ width: done ? "100%" : "0%" }}
                        animate={{ width: done ? "100%" : cur ? `${Math.round(progress * 100)}%` : "0%" }}
                        transition={{ duration: 0.12, ease: "linear" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-30 pt-10 px-4 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white text-slate-900 font-extrabold grid place-items-center shadow-lg shrink-0">
                    {(story?.educator?.avatarLetter || educatorName?.[0] || "E").toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[12px] font-extrabold truncate text-slate-950 dark:text-white">{educatorName}</p>
                      <span className="text-[11px] truncate text-slate-700/70 dark:text-white/55">{educatorId}</span>
                    </div>

                    <p className="text-[11px] flex items-center gap-2 text-slate-700/80 dark:text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        {secondsToLabel(story?.durationSec ?? 12)}
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {badgeText}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur grid place-items-center"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur grid place-items-center"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative w-full h-full bg-black/10 dark:bg-black/35">
              <AnimatePresence mode="wait">
                <motion.div
                  key={storyId}
                  initial={{ opacity: 0, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.005 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0"
                >
                  {/* IMAGE */}
                  {story?.type === "image" && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <img
                        key={mediaSrc}
                        src={mediaSrc}
                        alt={titleText || "story"}
                        className="max-h-full max-w-full object-contain"
                        onError={() => setMediaBroken(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                    </div>
                  )}

                  {/* VIDEO */}
                  {story?.type === "video" && (
                    <div className="absolute inset-0 bg-black">
                      <video
                        key={mediaSrc}
                        ref={videoRef}
                        src={mediaSrc}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                        preload="metadata"
                        onCanPlay={() => {
                          setVideoReady(true);
                          if (!isPaused) videoRef.current?.play().catch(() => {});
                        }}
                        onEnded={() => next()}
                        onError={() => setMediaBroken(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                    </div>
                  )}

                  {/* TEXT */}
                  {story?.type === "text" && (
                    <div className="absolute inset-0" style={{ background: STORY_BG[story?.bgIndex ?? 0] }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55 pointer-events-none" />
                      <div className="relative z-10 h-full p-5 sm:p-8 flex flex-col justify-center">
                        <h2 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white">{titleText}</h2>
                        <p className="mt-3 text-[13px] sm:text-[15px] text-white/90 leading-relaxed max-w-2xl">{captionText}</p>
                      </div>
                    </div>
                  )}

                  {/* Bottom caption + like */}
                  <div className="absolute left-0 right-0 bottom-0 p-3 sm:p-5 z-20 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-[22px] bg-black/35 border border-white/10 backdrop-blur px-4 py-3"
                      >
                        <p className="text-[12px] sm:text-[13px] text-white/92 leading-relaxed line-clamp-3">
                          <span className="font-extrabold">{titleText}</span>
                          {captionText ? (
                            <>
                              <span className="opacity-70">:</span> {captionText}
                            </>
                          ) : null}
                        </p>

                        <div className="mt-2 text-[11px] text-white/85 font-semibold flex items-center gap-3">
                          <span>👁️ {story?.stats?.views ?? story?.views ?? 0}</span>
                          <span>❤️ {story?.stats?.likes ?? story?.likes ?? 0}</span>
                        </div>

                        
                      </motion.div>

                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike();
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "w-full sm:w-12 h-12 rounded-2xl border backdrop-blur grid place-items-center",
                          liked?.[storyId]
                            ? "bg-rose-500/20 border-rose-300/30 shadow-[0_18px_50px_rgba(244,63,94,0.25)]"
                            : "bg-white/10 border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
                        )}
                        aria-label="Like"
                        title="Like"
                      >
                        <div className="flex items-center justify-center gap-2 sm:gap-0">
                          <Heart
                            className={cn(
                              "w-5 h-5",
                              liked?.[storyId] ? "fill-rose-400 text-rose-300" : "text-white"
                            )}
                          />
                          <span className="sm:hidden text-[12px] font-black text-white/90">
                            {liked?.[storyId] ? "Liked" : "Like"}
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
