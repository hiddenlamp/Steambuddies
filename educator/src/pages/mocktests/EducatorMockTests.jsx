// src/pages/educator/mocktests/EducatorMockTests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Search, Eye, Pencil, Copy, BarChart3 } from "lucide-react";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

const StatusPill = ({ status }) => {
  const map = {
    draft: "bg-white/10 text-white",
    scheduled: "bg-blue-500/15 text-blue-200",
    live: "bg-emerald-500/15 text-emerald-200",
    ended: "bg-amber-500/15 text-amber-200",
    archived: "bg-zinc-500/15 text-zinc-200",
  };
  const label =
    status === "draft"
      ? "Draft"
      : status === "scheduled"
      ? "Scheduled"
      : status === "live"
      ? "Live"
      : status === "ended"
      ? "Ended"
      : status === "archived"
      ? "Archived"
      : String(status || "Draft");

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", map[status] || map.draft)}>
      {label}
    </span>
  );
};

export default function EducatorMockTests() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || [])
      .filter((x) => (status === "all" ? true : (x.status || "draft") === status))
      .filter((x) => {
        if (!s) return true;
        const hay = `${x.title || ""} ${x.subject || ""} ${(x.topics || []).join(" ")}`
          .toLowerCase()
          .trim();
        return hay.includes(s);
      });
  }, [items, q, status]);

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      // ✅ Backend has: GET /api/mock-tests
      const res = await api.get("/mock-tests");
      const data = res?.data;

      // supports either array or {items:[]}
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
    } catch (e) {
      setErr(getApiError(e) || "Failed to load mock tests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Backend doesn't have /duplicate route.
   * So we do "duplicate" on frontend:
   * 1) GET original
   * 2) POST /mock-tests with copied payload
   */
  const duplicateTest = async (id) => {
    try {
      const a = await api.get(`/mock-tests/${id}`);
      const original = a?.data;

      // Create payload by copying safe fields
      const payload = {
        title: (original?.title ? `${original.title} (Copy)` : "Untitled (Copy)"),
        subject: original?.subject || "",
        topics: Array.isArray(original?.topics) ? original.topics : [],
        instructions: original?.instructions || "",
        durationMinutes: original?.durationMinutes || 0,
        startAt: original?.startAt || null,
        endAt: original?.endAt || null,
        negativeMarking: !!original?.negativeMarking,
        // you can copy more fields if your backend supports them:
        // totalQuestions: original?.totalQuestions ?? 0,
        // marksPerQuestion: original?.marksPerQuestion ?? 1,
        // negativePerQuestion: original?.negativePerQuestion ?? 0,
      };

      const b = await api.post("/mock-tests", payload);
      const newId = b?.data?._id;

      await fetchAll();
      if (newId) nav(`/educator/mock-tests/${newId}`);
    } catch (e) {
      alert(getApiError(e) || "Duplicate failed");
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Mock Tests</h1>
          <p className="text-white/70 text-sm mt-1">
            Create, schedule, monitor students, and publish leaderboard.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => nav("/educator/mock-tests/new")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            <Plus size={16} />
            New Test
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
            <Search className="text-white/60" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, subject, topic…"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="md:col-span-5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-white outline-none"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {err ? (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {(loading ? Array.from({ length: 6 }).map((_, i) => ({ _id: `s-${i}` })) : filtered).map(
          (x, idx) => {
            const isSkeleton = loading;
            const joined = x?.stats?.joined ?? x?.joined ?? 0;
            const attempts = x?.stats?.attempts ?? x?.attempts ?? 0;

            return (
              <motion.div
                key={x._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold truncate">
                        {isSkeleton ? "Loading…" : x.title || "Untitled Mock Test"}
                      </h3>
                      {!isSkeleton ? <StatusPill status={x.status || "draft"} /> : null}
                    </div>

                    <p className="text-white/70 text-sm mt-1">
                      {isSkeleton
                        ? "…"
                        : `${x.subject || "Subject"} • ${(x.topics || []).slice(0, 3).join(", ")}`}
                      {!isSkeleton && (x.topics || []).length > 3 ? "…" : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                        ⏱ {isSkeleton ? "-" : `${x.durationMinutes || 0} min`}
                      </span>
                      <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                        👥 Joined: {isSkeleton ? "-" : joined}
                      </span>
                      <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                        🧾 Attempts: {isSkeleton ? "-" : attempts}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={isSkeleton}
                    onClick={() => nav(`/educator/mock-tests/${x._id}`)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
                  >
                    <Eye size={16} /> Manage
                  </button>

                  <button
                    disabled={isSkeleton}
                    onClick={() => nav(`/educator/mock-tests/${x._id}`)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
                  >
                    <Pencil size={16} /> Edit
                  </button>

                  <button
                    disabled={isSkeleton}
                    onClick={() => duplicateTest(x._id)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
                  >
                    <Copy size={16} /> Duplicate
                  </button>

                  <button
                    disabled={isSkeleton}
                    onClick={() => nav(`/educator/mock-tests/${x._id}#leaderboard`)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
                  >
                    <BarChart3 size={16} /> Leaderboard
                  </button>
                </div>
              </motion.div>
            );
          }
        )}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="mt-8 text-center text-white/70">
          No mock tests found.{" "}
          <button className="text-emerald-300 underline" onClick={() => nav("/educator/mock-tests/new")}>
            Create one
          </button>
          .
        </div>
      ) : null}
    </div>
  );
}
