// src/pages/educator/mocktests/MockTestManage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  FileText,
  BarChart3,
  UploadCloud,
  Loader2,
} from "lucide-react";
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
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", map[status] || map.draft)}>
      {(status || "draft").toUpperCase()}
    </span>
  );
};

export default function MockTestManage() {
  const nav = useNavigate();
  const { id } = useParams();

  const [tab, setTab] = useState("overview"); // overview | students | leaderboard
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [test, setTest] = useState(null);

  // Students tracking (summary)
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsErr, setStudentsErr] = useState("");
  const [students, setStudents] = useState([]); // [{studentId, name, joinedAt, startedAt, submittedAt, score}]

  // Leaderboard
  const [lbLoading, setLbLoading] = useState(false);
  const [lbErr, setLbErr] = useState("");
  const [leaderboard, setLeaderboard] = useState([]); // [{rank, name, score, timeTakenSec}]
  const [publishing, setPublishing] = useState(false);

  const stats = useMemo(() => {
    const joined = test?.stats?.joined ?? 0;
    const attempts = test?.stats?.attempts ?? 0;
    const submissions = test?.stats?.submissions ?? 0;
    return { joined, attempts, submissions };
  }, [test]);

  const fetchTest = async () => {
    setLoading(true);
    setErr("");
    try {
      // GET /mock-tests/:id
      const res = await api.get(`/mock-tests/${id}`);
      setTest(res?.data || null);
    } catch (e) {
      setErr(getApiError(e) || "Failed to load test");
      setTest(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    setStudentsErr("");
    try {
      // GET /mock-tests/:id/students
      // returns: { items: [{studentId, name, joinedAt, startedAt, submittedAt, score}] }
      const res = await api.get(`/mock-tests/${id}/students`);
      setStudents(res?.data?.items || res?.data || []);
    } catch (e) {
      setStudentsErr(getApiError(e) || "Failed to load students");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLbLoading(true);
    setLbErr("");
    try {
      // GET /mock-tests/:id/leaderboard
      const res = await api.get(`/mock-tests/${id}/leaderboard`);
      setLeaderboard(res?.data?.items || res?.data || []);
    } catch (e) {
      setLbErr(getApiError(e) || "Failed to load leaderboard");
      setLeaderboard([]);
    } finally {
      setLbLoading(false);
    }
  };

  const publishLeaderboard = async () => {
    setPublishing(true);
    try {
      // POST /mock-tests/:id/leaderboard/publish
      await api.post(`/mock-tests/${id}/leaderboard/publish`);
      alert("Leaderboard published to students ✅");
      await fetchTest();
    } catch (e) {
      alert(getApiError(e) || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === "students") fetchStudents();
    if (tab === "leaderboard") fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => nav("/educator/mock-tests")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          onClick={fetchTest}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-white truncate">
                {loading ? "Loading…" : test?.title || "Mock Test"}
              </h1>
              {!loading ? <StatusPill status={test?.status || "draft"} /> : null}
            </div>
            <p className="text-white/70 text-sm mt-1">
              {test?.subject || "Subject"} • {(test?.topics || []).join(", ") || "Topics"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                ⏱ {test?.durationMinutes || 0} min
              </span>
              <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                🧩 Questions: {test?.totalQuestions ?? test?.questions?.length ?? 0}
              </span>
              <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                👥 Joined: {stats.joined}
              </span>
              <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                🧾 Attempts: {stats.attempts}
              </span>
              <span className="px-2 py-1 rounded-xl bg-white/10 text-white/90">
                ✅ Submissions: {stats.submissions}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("overview")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white",
                tab === "overview" ? "bg-white/15" : "bg-white/10 hover:bg-white/15"
              )}
            >
              <FileText size={16} /> Overview
            </button>

            <button
              onClick={() => setTab("students")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white",
                tab === "students" ? "bg-white/15" : "bg-white/10 hover:bg-white/15"
              )}
            >
              <Users size={16} /> Students
            </button>

            <button
              onClick={() => setTab("leaderboard")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white",
                tab === "leaderboard" ? "bg-white/15" : "bg-white/10 hover:bg-white/15"
              )}
            >
              <BarChart3 size={16} /> Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-4">
        {tab === "overview" ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="text-white font-bold">Overview</h2>
            <div className="mt-2 text-white/70 text-sm space-y-2">
              <p>
                <span className="text-white/80 font-semibold">Schedule:</span>{" "}
                {test?.startAt ? new Date(test.startAt).toLocaleString() : "—"}{" "}
                <span className="text-white/40">to</span>{" "}
                {test?.endAt ? new Date(test.endAt).toLocaleString() : "—"}
              </p>
              <p>
                <span className="text-white/80 font-semibold">Instructions:</span>{" "}
                {test?.instructions || "—"}
              </p>
              <p>
                <span className="text-white/80 font-semibold">Negative Marking:</span>{" "}
                {test?.negativeMarking ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-white font-semibold">Questions Preview</h3>
              <div className="mt-2 space-y-2">
                {(test?.questions || []).slice(0, 5).map((q, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-white font-semibold">
                      Q{i + 1}. {q.question}
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(q.options || []).map((op, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm border",
                            oi === q.correctIndex
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100"
                              : "bg-white/5 border-white/10 text-white/90"
                          )}
                        >
                          <span className="text-white/60 mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {op}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(test?.questions || []).length > 5 ? (
                  <div className="text-white/60 text-sm">
                    Showing 5 of {(test?.questions || []).length} questions…
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "students" ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-white font-bold">Students Tracking</h2>
              <button
                onClick={fetchStudents}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {studentsErr ? (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
                {studentsErr}
              </div>
            ) : null}

            {studentsLoading ? (
              <div className="mt-4 text-white/70 inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Loading…
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2">
              {students.map((s, idx) => (
                <motion.div
                  key={`${s.studentId || idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.01 }}
                  className="rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{s.name || "Student"}</p>
                    <p className="text-white/60 text-xs">
                      Joined: {s.joinedAt ? new Date(s.joinedAt).toLocaleString() : "—"} • Started:{" "}
                      {s.startedAt ? new Date(s.startedAt).toLocaleString() : "—"} • Submitted:{" "}
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="text-white/80 text-sm">
                    Score: <b className="text-white">{Number.isFinite(Number(s.score)) ? s.score : "—"}</b>
                  </div>
                </motion.div>
              ))}
            </div>

            {!studentsLoading && students.length === 0 ? (
              <div className="mt-6 text-white/70 text-sm">No students data yet.</div>
            ) : null}
          </div>
        ) : null}

        {tab === "leaderboard" ? (
          <div id="leaderboard" className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h2 className="text-white font-bold">Leaderboard</h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchLeaderboard}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
                >
                  <RefreshCw size={16} /> Refresh
                </button>

                <button
                  onClick={publishLeaderboard}
                  disabled={publishing}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white font-semibold",
                    publishing ? "bg-emerald-500/60" : "bg-emerald-500 hover:bg-emerald-600"
                  )}
                >
                  {publishing ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                  Publish to Students
                </button>
              </div>
            </div>

            {lbErr ? (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
                {lbErr}
              </div>
            ) : null}

            {lbLoading ? (
              <div className="mt-4 text-white/70 inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Loading…
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {leaderboard.map((r, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border p-3 flex items-center justify-between",
                    idx === 0
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-extrabold">
                      {r.rank || idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{r.name || "Student"}</p>
                      <p className="text-white/60 text-xs">
                        Time:{" "}
                        {Number.isFinite(Number(r.timeTakenSec))
                          ? `${Math.round(r.timeTakenSec / 60)} min`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-white/90 font-bold">
                    {Number.isFinite(Number(r.score)) ? r.score : "—"}
                  </div>
                </div>
              ))}
            </div>

            {!lbLoading && leaderboard.length === 0 ? (
              <div className="mt-6 text-white/70 text-sm">
                Leaderboard not ready yet (students submissions needed).
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
