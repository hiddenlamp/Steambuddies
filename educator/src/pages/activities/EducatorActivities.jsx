// src/pages/educator/activities/EducatorActivities.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Heart,
  Trash2,
  RefreshCcw,
  Video,
  Image as Img,
  FileText,
} from "lucide-react";

import { myActivitiesApi, deleteActivityApi } from "../../api/activities.api";
import { getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

function typeIcon(type) {
  if (type === "video") return Video;
  if (type === "image") return Img;
  return FileText;
}

function safeUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ✅ works with string OR {en,hi}
function pickLangText(v, lang = "en") {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v?.[lang] || v?.en || v?.hi || "";
  return String(v);
}

export default function EducatorActivities() {
  const nav = useNavigate();
  const user = useMemo(() => safeUser(), []);
  const lang = (localStorage.getItem("hl_lang") || "en").toLowerCase();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");

  const normalizeId = (a) => a?._id || a?.id || a?.activityId || "";

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      // ✅ IMPORTANT: axios interceptor returns data directly
      const data = await myActivitiesApi();

      // ✅ handle multiple possible shapes (safe)
      const list =
        data?.activities ||
        data?.data?.activities ||
        data?.items ||
        data?.data?.items ||
        [];

      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(getApiError(e, "Failed to load activities"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalViews = useMemo(
    () => items.reduce((a, x) => a + (x?.stats?.views || x?.views || 0), 0),
    [items]
  );

  const totalLikes = useMemo(
    () => items.reduce((a, x) => a + (x?.stats?.likes || x?.likes || 0), 0),
    [items]
  );

  const onDelete = async (activity) => {
    const id = typeof activity === "string" ? activity : normalizeId(activity);
    if (!id) return;

    setBusyId(id);
    try {
      await deleteActivityApi(id);
      setItems((prev) => prev.filter((x) => normalizeId(x) !== id));
    } catch (e) {
      alert(getApiError(e, "Delete failed"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="text-white">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-extrabold tracking-[0.18em]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ACTIVITIES
          </div>
          <h2 className="mt-2 text-[18px] sm:text-[20px] font-black leading-tight">
            Your Daily Activity Feed
          </h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">
            Post video/image/text updates — students see them in Quest. Track views & likes.
          </p>
        </div>

        <div className="flex gap-2 sm:justify-end">
          <button
            onClick={load}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
            )}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={() => nav("/educator/activities/new")}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-gradient-to-r from-sky-400/25 via-indigo-400/20 to-fuchsia-400/20",
              "border border-white/12 hover:border-white/20 transition shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
            )}
          >
            <Plus className="h-4 w-4" />
            New Activity
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[10px] text-white/55 font-extrabold tracking-[0.16em] uppercase">
            Educator
          </p>
          <p className="mt-1 text-[14px] font-black truncate">
            {user?.name || user?.fullName || "Educator"}
          </p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[10px] text-white/55 font-extrabold tracking-[0.16em] uppercase">
            Total Views
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-white/70" />
            <p className="text-[18px] font-black">{totalViews}</p>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[10px] text-white/55 font-extrabold tracking-[0.16em] uppercase">
            Total Likes
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-white/70" />
            <p className="text-[18px] font-black">{totalLikes}</p>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="mt-4">
        {err && (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[12px] font-semibold text-red-100">
            {err}
          </div>
        )}

        {loading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 text-[13px] font-semibold text-white/70">
            Loading activities…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 text-[13px] font-semibold text-white/70">
            No activity posted yet. Click <span className="text-white">New Activity</span> to post.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <AnimatePresence>
              {items.map((a) => {
                const Icon = typeIcon(a?.type);
                const id = normalizeId(a);
                const views = a?.stats?.views ?? a?.views ?? 0;
                const likes = a?.stats?.likes ?? a?.likes ?? 0;

                const title = pickLangText(a?.title, lang) || "Untitled";
                const caption = pickLangText(a?.caption, lang) || "—";

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="size-12 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
                          <Icon className="h-5 w-5 text-white/85" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[13px] font-black truncate">{title}</p>

                          <p className="mt-1 text-[11px] text-white/65 font-semibold line-clamp-2">
                            {caption}
                          </p>

                          <div className="mt-2 flex items-center gap-3 text-[11px] text-white/70 font-semibold">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" /> {views}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" /> {likes}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDelete(a)}
                        disabled={busyId === id}
                        className={cn(
                          "rounded-2xl p-2 border transition",
                          busyId === id
                            ? "opacity-60 cursor-not-allowed bg-white/5 border-white/10"
                            : "bg-red-500/10 hover:bg-red-500/16 border-red-400/20 hover:border-red-300/25"
                        )}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-white/85" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
