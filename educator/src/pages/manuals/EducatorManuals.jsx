// src/pages/educator/manuals/EducatorManuals.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  Tag,
  Layers,
  Calendar,
  Globe,
  Lock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

const safeText = (v, lang = "en") => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v?.[lang] ?? v?.en ?? v?.hi ?? "";
};

const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
};

export default function EducatorManuals() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      // ✅ axios baseURL already has /api
      // ✅ response interceptor returns data directly
      const data = await api.get("/manuals");

      const arr = Array.isArray(data) ? data : data?.data;
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setErr(getApiError?.(e) || "Failed to load manuals");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;

    return items.filter((m) => {
      const title = (safeText(m?.title, "en") + " " + safeText(m?.title, "hi")).toLowerCase();
      const desc = (safeText(m?.description, "en") + " " + safeText(m?.description, "hi")).toLowerCase();
      const cat = (m?.category || "").toLowerCase();
      const grd = (m?.grade || "").toLowerCase();
      const tags = Array.isArray(m?.tags) ? m.tags.join(" ").toLowerCase() : "";
      return title.includes(qq) || desc.includes(qq) || cat.includes(qq) || grd.includes(qq) || tags.includes(qq);
    });
  }, [items, q]);

  const togglePublish = async (id, next) => {
    try {
      await api.patch(`/manuals/${id}/publish`, { isPublished: next });
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isPublished: next } : x)));
    } catch (e) {
      alert(getApiError?.(e) || "Publish update failed");
    }
  };

  const delOne = async (id) => {
    if (!window.confirm("Delete this manual?")) return;
    try {
      await api.delete(`/manuals/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      alert(getApiError?.(e) || "Delete failed");
    }
  };

  return (
    <div className="text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.22em] text-white/55 uppercase">Resources</p>
          <h2 className="mt-1 text-[20px] md:text-[22px] font-black">
            Manuals{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Manager
            </span>
          </h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">Your uploaded manuals will appear here.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchList}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
          >
            <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </button>

          <button
            onClick={() => nav("/educator/manuals/new")}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black bg-white text-slate-900 hover:bg-white/90 transition"
          >
            <Plus className="h-4 w-4" />
            New Manual
          </button>
        </div>
      </div>

      <div className="mt-4 relative w-full sm:w-[520px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/55" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title / tags / class / category..."
          className="w-full rounded-2xl pl-10 pr-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/40"
        />
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
          <p className="font-black text-red-200">Couldn’t load manuals</p>
          <p className="mt-1 text-sm text-red-200/80">{err}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!loading ? (
          <AnimatePresence>
            {filtered.map((m) => {
              const isPub = !!m?.isPublished;

              return (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-black line-clamp-2">{safeText(m?.title, "en")}</p>
                      <p className="mt-1 text-[12px] text-white/70 font-semibold line-clamp-1">{safeText(m?.title, "hi")}</p>

                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70 font-semibold">
                        {m?.category ? (
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {m.category}
                          </span>
                        ) : null}
                        {m?.grade ? (
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            {m.grade}
                          </span>
                        ) : null}
                        {m?.createdAt ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {fmtDate(m.createdAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="size-10 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
                      <FileText className="h-5 w-5 text-white/85" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                        isPub
                          ? "bg-emerald-400/10 border-emerald-300/20 text-emerald-100"
                          : "bg-amber-400/10 border-amber-300/20 text-amber-100"
                      )}
                    >
                      {isPub ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {isPub ? "Published" : "Draft"}
                    </span>

                    <button
                      onClick={() => togglePublish(m._id, !isPub)}
                      className="rounded-2xl px-3 py-2 text-[12px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
                    >
                      {isPub ? "Unpublish" : "Publish"}
                    </button>
                  </div>

                  <button
                    onClick={() => delOne(m._id)}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-black bg-red-500/10 hover:bg-red-500/16 border border-red-400/20 hover:border-red-300/25 transition"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-white/70 font-semibold">Loading…</div>
        )}
      </div>
    </div>
  );
}
