// src/pages/mocktests/MockTest.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter } from "lucide-react";

import {
  Sparkles,
  ArrowLeft,
  Timer,
  PlayCircle,
  BookOpen,
  CheckCircle2,
  X,
  Search,
  Trophy,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { api } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

function msToClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getAuthUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border backdrop-blur-md",
        active
          ? "bg-white text-slate-950 border-white shadow-[0_18px_60px_rgba(0,0,0,0.25)] dark:bg-white dark:text-slate-950"
          : "bg-white/60 text-slate-800 border-black/10 hover:bg-white dark:bg-white/[0.06] dark:text-white/85 dark:border-white/12 dark:hover:bg-white/[0.09]"
      )}
    >
      {children}
    </button>
  );
}

/** ===================== API HELPERS ===================== */
/**
 * You can adjust paths to match backend.
 * Expected (recommended) response shapes shown below in comments.
 */
async function fetchTestsPublic() {
  // ✅ Expect: { data: [{_id,title,subject,topics,scheduledAt,durationMin,totalMarks,questionsCount,status}] }
  const res = await api.get("/mock-tests/public");
  const data = res?.data ?? res;
  const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
  return items;
}

async function fetchTestDetail(testId) {
  // ✅ Expect: { data: { _id,title,subject,topics,durationMin,totalMarks,questions:[{_id,question,options:[...],correctOptionIndex?}] } }
  const res = await api.get(`/mock-tests/${testId}`);
  const data = res?.data ?? res;
  return data?.data ?? data;
}

async function startAttempt(testId) {
  // Optional. Backend can create attemptId + server start time.
  // ✅ Expect: { data: { attemptId, startedAt, endsAt } }
  const res = await api.post(`/mock-tests/${testId}/attempts`, {});
  const data = res?.data ?? res;
  return data?.data ?? data;
}

async function submitAttempt(testId, payload) {
  // ✅ payload: { attemptId?, answers: [{qId, selectedIndex}], clientStartedAt, clientEndedAt, timeTakenSec }
  // ✅ Expect: { data: { score, total, percent, correct, wrong, skipped, rank?, leaderboard? } }
  const res = await api.post(`/mock-tests/${testId}/submit`, payload);
  const data = res?.data ?? res;
  return data?.data ?? data;
}

async function fetchLeaderboard(testId) {
  // ✅ Expect: { data: [{name, score, timeTakenSec, rank}] }
  const res = await api.get(`/mock-tests/${testId}/leaderboard`);
  const data = res?.data ?? res;
  const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
  return items;
}

/** ===================== NORMALIZERS ===================== */
function normTest(t) {
  const id = String(t?._id ?? t?.id ?? "");
  return {
    id,
    title: t?.title?.en || t?.title || t?.name || "Mock Test",
    subject: t?.subject || "General",
    topics: Array.isArray(t?.topics) ? t.topics : (t?.topics ? [String(t.topics)] : []),
    scheduledAt: t?.scheduledAt || t?.scheduleAt || t?.startsAt || "",
    durationMin: Number(t?.durationMin ?? t?.duration ?? 15) || 15,
    totalMarks: Number(t?.totalMarks ?? t?.marks ?? 100) || 100,
    questionsCount: Number(t?.questionsCount ?? t?.questions?.length ?? 0) || 0,
    status: t?.status || "active", // active/closed/upcoming
  };
}

function normQuestion(q, idx) {
  const qId = String(q?._id ?? q?.id ?? `q-${idx}`);
  const question = q?.question || q?.text || `Question ${idx + 1}`;
  const options = Array.isArray(q?.options) ? q.options : [];
  return {
    qId,
    question,
    options: options.map((o) => (typeof o === "string" ? o : o?.text ?? String(o))),
  };
}

/** ===================== UI ===================== */
function StatPill({ icon: Icon, label, value }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3",
        "border border-black/10 dark:border-white/12",
        "bg-white/55 dark:bg-white/[0.06] backdrop-blur-2xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-900/80 dark:text-white/80" />
        <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
          {label}
        </div>
      </div>
      <div className="mt-1 text-sm sm:text-base font-black text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function TestCard({ t, onStart, lang }) {
  const when = t.scheduledAt ? new Date(t.scheduledAt) : null;
  const whenLabel = when && !Number.isNaN(+when) ? when.toLocaleString() : (lang === "hi" ? "अभी उपलब्ध" : "Available now");

  return (
    <motion.div
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "group relative rounded-[28px] overflow-hidden",
        "border border-black/10 dark:border-white/12",
        "bg-white/75 dark:bg-[#0B1020]/70 backdrop-blur-xl",
        "shadow-[0_26px_80px_rgba(0,0,0,0.20)]"
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="pointer-events-none absolute -inset-28 opacity-60 blur-2xl bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-sky-500/30" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-slate-900 dark:text-white line-clamp-1">
              {t.title}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 dark:text-white/70 line-clamp-2">
              <span className="font-bold">{lang === "hi" ? "विषय:" : "Subject:"}</span> {t.subject}
              {t.topics?.length ? (
                <>
                  {" "}
                  • <span className="font-bold">{lang === "hi" ? "टॉपिक्स:" : "Topics:"}</span>{" "}
                  {t.topics.slice(0, 3).join(", ")}
                  {t.topics.length > 3 ? "…" : ""}
                </>
              ) : null}
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide",
              "border border-black/10 dark:border-white/12",
              "bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/75"
            )}
          >
            {t.durationMin}m
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.05]">
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
              {lang === "hi" ? "प्रश्न" : "QUESTIONS"}
            </div>
            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
              {t.questionsCount || "—"}
            </div>
          </div>

          <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.05]">
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
              {lang === "hi" ? "मार्क्स" : "MARKS"}
            </div>
            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
              {t.totalMarks}
            </div>
          </div>

          <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.05]">
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
              {lang === "hi" ? "समय" : "SCHEDULE"}
            </div>
            <div className="mt-1 text-[11px] font-extrabold text-slate-950 dark:text-white/85 line-clamp-1">
              {whenLabel}
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className={cn(
            "mt-4 w-full rounded-2xl px-4 py-3 font-extrabold text-sm",
            "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all",
            "dark:bg-white dark:text-slate-950",
            "shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
          )}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <PlayCircle className="w-4 h-4" />
            {lang === "hi" ? "टेस्ट शुरू करें" : "Start Test"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/** ===================== MAIN ===================== */
export default function MockTest() {
  const nav = useNavigate();
  const { theme } = useContext(ThemeContext) || { theme: "dark" };
  const { language } = useContext(LanguageContext) || { language: "en" };
  const lang = language || "en";

  const user = useMemo(() => getAuthUser(), []);
  const isLoggedIn = !!user;

  const [screen, setScreen] = useState("list"); // list | intro | exam | result
  const [query, setQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState("all");

  // List
  const [testsRaw, setTestsRaw] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listErr, setListErr] = useState("");

  // Current test
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);

  // Attempt
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({}); // { [qId]: selectedIndex }
  const [startedAt, setStartedAt] = useState(null);
  const [endsAt, setEndsAt] = useState(null);

  // Timer
  const tickRef = useRef(null);
  const [now, setNow] = useState(Date.now());

  // Result
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultErr, setResultErr] = useState("");

  // Guards
  useEffect(() => {
    if (!isLoggedIn) {
      nav("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Load list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setListLoading(true);
        setListErr("");
        const items = await fetchTestsPublic();
        if (!mounted) return;
        setTestsRaw(items.map(normTest));
      } catch (e) {
        if (!mounted) return;
        setTestsRaw([]);
        setListErr(e?.message || "Failed to load mock tests");
      } finally {
        if (mounted) setListLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Subjects filters
  const subjects = useMemo(() => {
    const set = new Set((testsRaw || []).map((t) => t.subject).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [testsRaw]);

  const tests = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = testsRaw;

    if (activeSubject !== "all") list = list.filter((t) => t.subject === activeSubject);

    if (q) {
      list = list.filter((t) => {
        const s = `${t.title} ${t.subject} ${(t.topics || []).join(" ")}`.toLowerCase();
        return s.includes(q);
      });
    }
    return list;
  }, [testsRaw, query, activeSubject]);

  const storageKey = useMemo(() => {
    const uid = user?._id || user?.id || user?.email || "student";
    const tid = test?.id || "none";
    return `mocktest:${uid}:${tid}`;
  }, [user, test]);

  // Restore draft on test load
  useEffect(() => {
    if (!test?.id) return;
    const saved = safeParseJSON(localStorage.getItem(storageKey) || "");
    if (saved?.answers && typeof saved.answers === "object") setAnswers(saved.answers);
    if (saved?.attemptId) setAttemptId(saved.attemptId);
    if (saved?.startedAt) setStartedAt(saved.startedAt);
    if (saved?.endsAt) setEndsAt(saved.endsAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.id]);

  // Persist draft
  useEffect(() => {
    if (!test?.id) return;
    const payload = { answers, attemptId, startedAt, endsAt };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [answers, attemptId, startedAt, endsAt, storageKey, test?.id]);

  // Timer tick
  useEffect(() => {
    if (screen !== "exam") return;
    tickRef.current = setInterval(() => setNow(Date.now()), 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [screen]);

  const remainingMs = useMemo(() => {
    if (!endsAt) return 0;
    return Math.max(0, Number(endsAt) - now);
  }, [endsAt, now]);

  const totalQ = questions.length;
  const attempted = useMemo(() => Object.keys(answers || {}).length, [answers]);
  const skipped = useMemo(() => Math.max(0, totalQ - attempted), [totalQ, attempted]);

  // Auto submit when time up
  useEffect(() => {
    if (screen !== "exam") return;
    if (!endsAt) return;
    if (remainingMs > 0) return;

    // time up -> submit once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    handleSubmit(true);
  }, [remainingMs, endsAt, screen]);

  async function openTestIntro(t) {
    setResult(null);
    setLeaderboard([]);
    setResultErr("");
    setResultLoading(false);

    setTest(t);
    setQuestions([]);
    setQIndex(0);
    setAnswers({});
    setAttemptId(null);
    setStartedAt(null);
    setEndsAt(null);

    // load detail (questions)
    try {
      const detail = await fetchTestDetail(t.id);
      const qsRaw = Array.isArray(detail?.questions) ? detail.questions : [];
      const qs = qsRaw.map(normQuestion);
      setQuestions(qs);

      // If detail overrides:
      const durationMin = Number(detail?.durationMin ?? t.durationMin ?? 15) || 15;
      setTest((prev) => ({ ...(prev || t), durationMin }));
      setScreen("intro");
    } catch (e) {
      setListErr(e?.message || "Failed to open test");
      setScreen("list");
    }
  }

  async function beginExam() {
    if (!test?.id) return;
    // create attempt on server (recommended)
    let attempt = null;
    try {
      attempt = await startAttempt(test.id);
    } catch {
      attempt = null; // allow client-only attempt if backend not implemented yet
    }

    const clientStart = Date.now();
    const durationMs = (Number(test.durationMin) || 15) * 60 * 1000;

    const serverAttemptId = attempt?.attemptId || attempt?.id || null;
    const serverEndsAt = attempt?.endsAt ? Number(new Date(attempt.endsAt)) : null;
    const serverStartedAt = attempt?.startedAt ? Number(new Date(attempt.startedAt)) : null;

    const start = serverStartedAt || clientStart;
    const end = serverEndsAt || start + durationMs;

    setAttemptId(serverAttemptId);
    setStartedAt(start);
    setEndsAt(end);

    setNow(Date.now());
    setScreen("exam");
  }

  function selectOption(qId, idx) {
    setAnswers((prev) => ({ ...(prev || {}), [qId]: idx }));
  }

  function clearAnswer(qId) {
    setAnswers((prev) => {
      const copy = { ...(prev || {}) };
      delete copy[qId];
      return copy;
    });
  }

  async function handleSubmit(isAuto = false) {
    // prevent double submit
    if (resultLoading) return;
    if (!test?.id) return;

    setResultLoading(true);
    setResultErr("");

    try {
      const endTs = Date.now();
      const startTs = Number(startedAt) || endTs;
      const timeTakenSec = Math.max(0, Math.floor((endTs - startTs) / 1000));

      const payload = {
        attemptId: attemptId || undefined,
        answers: questions.map((q) => ({
          qId: q.qId,
          selectedIndex: Number.isFinite(Number(answers?.[q.qId])) ? Number(answers[q.qId]) : null,
        })),
        clientStartedAt: startTs,
        clientEndedAt: endTs,
        timeTakenSec,
        isAutoSubmit: !!isAuto,
      };

      const res = await submitAttempt(test.id, payload);
      setResult(res || { score: 0, total: test.totalMarks });

      // try leaderboard
      let lb = [];
      try {
        lb = await fetchLeaderboard(test.id);
      } catch {
        lb = res?.leaderboard || [];
      }
      setLeaderboard(Array.isArray(lb) ? lb : []);

      // cleanup draft
      localStorage.removeItem(storageKey);

      setScreen("result");
    } catch (e) {
      setResultErr(e?.message || "Submit failed");
    } finally {
      setResultLoading(false);
    }
  }

  function resetToList() {
    setScreen("list");
    setTest(null);
    setQuestions([]);
    setQIndex(0);
    setAnswers({});
    setAttemptId(null);
    setStartedAt(null);
    setEndsAt(null);
    setResult(null);
    setLeaderboard([]);
    setResultErr("");
    setResultLoading(false);
  }

  const currentQ = questions[qIndex] || null;

  const bgClass =
    theme === "dark"
      ? "bg-[#070A12]"
      : "bg-[radial-gradient(1100px_500px_at_15%_10%,rgba(56,189,248,0.30),transparent_55%),radial-gradient(900px_480px_at_85%_15%,rgba(168,85,247,0.25),transparent_60%),radial-gradient(900px_520px_at_50%_90%,rgba(34,197,94,0.18),transparent_60%),linear-gradient(180deg,#F8FBFF,#FFFFFF)]";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* background */}
      <div className={cn("absolute inset-0", bgClass)} />
      <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-60 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 md:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (screen === "list" ? nav(-1) : resetToList())}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl",
              "border border-black/10 dark:border-white/12",
              "text-slate-900 dark:text-white/90 hover:opacity-95 transition",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "hi" ? "वापस" : "Back"}
          </button>

          {screen === "exam" && (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5",
                "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl",
                "border border-black/10 dark:border-white/12",
                "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
              )}
            >
              <Timer className="w-4 h-4 text-slate-900/80 dark:text-white/85" />
              <div className="text-[13px] font-black text-slate-950 dark:text-white tabular-nums">
                {msToClock(remainingMs)}
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mt-6 text-center">
          <Kicker icon={Sparkles} label={lang === "hi" ? "मॉक टेस्ट" : "MOCK TESTS"} />

          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-[1.12] tracking-tight text-slate-950 dark:text-white">
            {lang === "hi" ? (
              <span className="inline">
                Live{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent">
                  Mock Tests
                </span>{" "}
                दें और अपना स्कोर देखें
              </span>
            ) : (
              <span className="inline">
                Take{" "}
                <span
                  className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  Live Mock Tests
                </span>{" "}
                and track your score
              </span>
            )}
          </h2>

          <p className="mt-3 mx-auto max-w-2xl text-[13px] sm:text-sm text-slate-700/80 dark:text-white/80">
            {lang === "hi"
              ? "टेस्ट कार्ड से शुरू करें, टाइमर के साथ attempt करें, फिर leaderboard में अपना rank देखें।"
              : "Start from any test card, attempt with a real timer, then see your score & leaderboard."}
          </p>
        </div>

        {/* ===================== LIST SCREEN ===================== */}
        {screen === "list" && (
          <>
            {/* Controls */}
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
                  placeholder={lang === "hi" ? "टेस्ट / विषय / टॉपिक खोजें..." : "Search test / subject / topic..."}
                  className={cn(
                    "w-full md:w-[380px] bg-transparent outline-none",
                    "text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/45"
                  )}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
                <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                  <Filter className="w-4 h-4" />
                  {lang === "hi" ? "विषय" : "SUBJECT"}
                </span>

                {subjects.map((s) => (
                  <Chip key={s} active={activeSubject === s} onClick={() => setActiveSubject(s)}>
                    {s === "all" ? (lang === "hi" ? "सभी" : "All") : s}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill icon={ClipboardList} label={lang === "hi" ? "कुल टेस्ट" : "TOTAL TESTS"} value={testsRaw.length} />
              <StatPill icon={ShieldCheck} label={lang === "hi" ? "लाइव मोड" : "LIVE MODE"} value={lang === "hi" ? "टाइम्ड" : "Timed"} />
              <StatPill icon={Trophy} label={lang === "hi" ? "लीडरबोर्ड" : "LEADERBOARD"} value={lang === "hi" ? "हाँ" : "Yes"} />
              <StatPill icon={BookOpen} label={lang === "hi" ? "आप" : "YOU"} value={user?.fullName || user?.name || "Student"} />
            </div>

            {/* Error */}
            {!!listErr && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">{listErr}</div>
                </div>
              </div>
            )}

            {/* Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
            >
              <AnimatePresence mode="popLayout">
                {listLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative rounded-[28px] overflow-hidden",
                        "border border-black/10 dark:border-white/12",
                        "bg-white/75 dark:bg-[#0B1020]/70 backdrop-blur-xl",
                        "shadow-[0_26px_80px_rgba(0,0,0,0.20)]"
                      )}
                    >
                      <div className="p-5">
                        <div className="h-5 w-2/3 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                        <div className="mt-3 h-4 w-1/2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
                          <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
                          <div className="h-16 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
                        </div>
                        <div className="mt-4 h-11 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : tests.length ? (
                  tests.map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    >
                      <TestCard t={t} lang={lang} onStart={() => openTestIntro(t)} />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center mt-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
                      <Sparkles className="w-4 h-4 text-slate-800 dark:text-white/70" />
                      <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">
                        {lang === "hi" ? "कोई टेस्ट नहीं मिला" : "No tests found"}
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* ===================== INTRO SCREEN ===================== */}
        {screen === "intro" && test && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className={cn(
              "mt-8 rounded-[32px] overflow-hidden",
              "border border-black/10 dark:border-white/12",
              "bg-white/75 dark:bg-[#0B1020]/75 backdrop-blur-2xl",
              "shadow-[0_30px_120px_rgba(0,0,0,0.30)]"
            )}
          >
            <div className="p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                    {test.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-white/70">
                    <span className="font-bold">{lang === "hi" ? "विषय:" : "Subject:"}</span> {test.subject}
                    {test.topics?.length ? (
                      <>
                        {" "}
                        • <span className="font-bold">{lang === "hi" ? "टॉपिक्स:" : "Topics:"}</span>{" "}
                        {test.topics.join(", ")}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill icon={Timer} label={lang === "hi" ? "समय" : "TIME"} value={`${test.durationMin} min`} />
                  <StatPill icon={ClipboardList} label={lang === "hi" ? "प्रश्न" : "QUESTIONS"} value={questions.length || "—"} />
                  <StatPill icon={Trophy} label={lang === "hi" ? "मार्क्स" : "MARKS"} value={test.totalMarks} />
                  <StatPill icon={ShieldCheck} label={lang === "hi" ? "मोड" : "MODE"} value={lang === "hi" ? "लाइव" : "Live"} />
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-3xl p-4 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                    {lang === "hi" ? "निर्देश" : "INSTRUCTIONS"}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-800/90 dark:text-white/80">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === "hi" ? "टाइमर शुरू होते ही टेस्ट लाइव हो जाएगा।" : "Once started, the timer runs live."}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === "hi" ? "आप कभी भी Next/Prev कर सकते हैं।" : "You can move Next/Prev anytime."}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === "hi" ? "टाइम खत्म होने पर auto submit हो जाएगा।" : "Auto-submit happens when time ends."}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      {lang === "hi" ? "Answers auto-save होते रहेंगे।" : "Answers are auto-saved."}
                    </li>
                  </ul>
                </div>

                <div className="rounded-3xl p-4 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                    {lang === "hi" ? "तैयार?" : "READY?"}
                  </div>

                  <div className="mt-3 text-sm text-slate-800/90 dark:text-white/80">
                    {lang === "hi"
                      ? "Start दबाते ही टेस्ट शुरू हो जाएगा। ध्यान से attempt करें।"
                      : "Press Start to begin the exam. Attempt carefully."}
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => resetToList()}
                      className={cn(
                        "w-full rounded-2xl px-4 py-3 font-extrabold text-sm",
                        "bg-white/70 dark:bg-white/[0.10] border border-black/10 dark:border-white/12",
                        "text-slate-900 dark:text-white hover:bg-white active:scale-[0.99] transition-all",
                        "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        {lang === "hi" ? "रद्द करें" : "Cancel"}
                      </span>
                    </button>

                    <button
                      onClick={beginExam}
                      className={cn(
                        "w-full rounded-2xl px-4 py-3 font-extrabold text-sm",
                        "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all",
                        "dark:bg-white dark:text-slate-950",
                        "shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        {lang === "hi" ? "Start Test" : "Start Test"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== EXAM SCREEN ===================== */}
        {screen === "exam" && test && (
          <div className="mt-8 grid lg:grid-cols-12 gap-4">
            {/* Left panel */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className={cn(
                "lg:col-span-8 rounded-[32px] overflow-hidden",
                "border border-black/10 dark:border-white/12",
                "bg-white/75 dark:bg-[#0B1020]/75 backdrop-blur-2xl",
                "shadow-[0_30px_120px_rgba(0,0,0,0.30)]"
              )}
            >
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                      {lang === "hi" ? "प्रश्न" : "QUESTION"} {qIndex + 1}/{questions.length}
                    </div>
                    <div className="mt-2 text-base sm:text-lg font-black text-slate-950 dark:text-white leading-snug">
                      {currentQ?.question || (lang === "hi" ? "लोड हो रहा है..." : "Loading...")}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={resultLoading}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                      "bg-slate-950 text-white hover:opacity-95 disabled:opacity-60 transition",
                      "dark:bg-white dark:text-slate-950",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {lang === "hi" ? "सबमिट" : "Submit"}
                  </button>
                </div>

                {/* Options */}
                <div className="mt-5 grid gap-2">
                  {(currentQ?.options || []).map((opt, i) => {
                    const selected = answers?.[currentQ.qId] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectOption(currentQ.qId, i)}
                        className={cn(
                          "text-left w-full rounded-2xl p-4 transition-all",
                          "border",
                          selected
                            ? "border-emerald-400/60 bg-emerald-500/10 dark:bg-emerald-400/10 shadow-[0_18px_60px_rgba(16,185,129,0.20)]"
                            : "border-black/10 dark:border-white/12 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.09]",
                          "shadow-[0_14px_50px_rgba(0,0,0,0.12)]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 w-7 h-7 rounded-xl grid place-items-center font-black text-xs",
                              selected
                                ? "bg-emerald-500 text-white"
                                : "bg-black/5 dark:bg-white/10 text-slate-800 dark:text-white/80 border border-black/10 dark:border-white/12"
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                          <div className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-white/85">
                            {opt}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <button
                    onClick={() => clearAnswer(currentQ?.qId)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold",
                      "bg-white/70 dark:bg-white/[0.10] border border-black/10 dark:border-white/12",
                      "text-slate-900 dark:text-white hover:bg-white active:scale-[0.99] transition-all",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                    )}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {lang === "hi" ? "क्लियर" : "Clear"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQIndex((v) => Math.max(0, v - 1))}
                      disabled={qIndex <= 0}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold",
                        "bg-white/70 dark:bg-white/[0.10] border border-black/10 dark:border-white/12",
                        "text-slate-900 dark:text-white hover:bg-white active:scale-[0.99] transition-all disabled:opacity-55",
                        "shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {lang === "hi" ? "पिछला" : "Prev"}
                    </button>

                    <button
                      onClick={() => setQIndex((v) => Math.min(questions.length - 1, v + 1))}
                      disabled={qIndex >= questions.length - 1}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold",
                        "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-55",
                        "dark:bg-white dark:text-slate-950",
                        "shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
                      )}
                    >
                      {lang === "hi" ? "अगला" : "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right panel */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.03 }}
              className={cn(
                "lg:col-span-4 rounded-[32px] overflow-hidden",
                "border border-black/10 dark:border-white/12",
                "bg-white/75 dark:bg-[#0B1020]/75 backdrop-blur-2xl",
                "shadow-[0_30px_120px_rgba(0,0,0,0.30)]"
              )}
            >
              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                    {lang === "hi" ? "प्रोग्रेस" : "PROGRESS"}
                  </div>
                  <div className="text-sm font-black text-slate-950 dark:text-white">
                    {attempted}/{totalQ}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                    <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                      {lang === "hi" ? "कुल" : "TOTAL"}
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">{totalQ}</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                    <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                      {lang === "hi" ? "अटेम्प्ट" : "DONE"}
                    </div>
                    <div className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">{attempted}</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                    <div className="text-[10px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/65">
                      {lang === "hi" ? "बाकी" : "LEFT"}
                    </div>
                    <div className="mt-1 text-sm font-black text-amber-700 dark:text-amber-300">{skipped}</div>
                  </div>
                </div>

                {/* Palette */}
                <div className="mt-5">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                    {lang === "hi" ? "क्विक नेविगेशन" : "QUICK NAV"}
                  </div>
                  <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2">
                    {questions.map((q, idx) => {
                      const isCurrent = idx === qIndex;
                      const isDone = answers?.[q.qId] !== undefined && answers?.[q.qId] !== null;
                      return (
                        <button
                          key={q.qId}
                          onClick={() => setQIndex(idx)}
                          className={cn(
                            "h-9 rounded-2xl text-xs font-black transition-all",
                            "border",
                            isCurrent
                              ? "border-sky-400/70 bg-sky-500/10 dark:bg-sky-400/10"
                              : isDone
                              ? "border-emerald-400/60 bg-emerald-500/10 dark:bg-emerald-400/10"
                              : "border-black/10 dark:border-white/12 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.09]",
                            "shadow-[0_14px_50px_rgba(0,0,0,0.10)]",
                            "text-slate-900 dark:text-white/85"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={resultLoading}
                  className={cn(
                    "mt-5 w-full rounded-2xl px-4 py-3 font-extrabold text-sm",
                    "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60",
                    "dark:bg-white dark:text-slate-950",
                    "shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                  )}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {resultLoading ? (lang === "hi" ? "सबमिट हो रहा है..." : "Submitting...") : (lang === "hi" ? "टेस्ट सबमिट करें" : "Submit Test")}
                  </span>
                </button>

                {!!resultErr && (
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                      <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">{resultErr}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ===================== RESULT SCREEN ===================== */}
        {screen === "result" && test && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className={cn(
              "mt-8 rounded-[32px] overflow-hidden",
              "border border-black/10 dark:border-white/12",
              "bg-white/75 dark:bg-[#0B1020]/75 backdrop-blur-2xl",
              "shadow-[0_30px_120px_rgba(0,0,0,0.30)]"
            )}
          >
            <div className="p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                    {lang === "hi" ? "टेस्ट रिजल्ट" : "Test Result"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-white/70">
                    <span className="font-bold">{test.title}</span> • {test.subject}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={resetToList}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
                      "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl",
                      "border border-black/10 dark:border-white/12",
                      "text-slate-900 dark:text-white/90 hover:opacity-95 transition",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {lang === "hi" ? "टेस्ट लिस्ट" : "Back to List"}
                  </button>
                </div>
              </div>

              {/* Score strip */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatPill icon={Trophy} label={lang === "hi" ? "स्कोर" : "SCORE"} value={`${result?.score ?? 0}/${result?.total ?? test.totalMarks}`} />
                <StatPill icon={CheckCircle2} label={lang === "hi" ? "सही" : "CORRECT"} value={result?.correct ?? "—"} />
                <StatPill icon={X} label={lang === "hi" ? "गलत" : "WRONG"} value={result?.wrong ?? "—"} />
                <StatPill icon={ClipboardList} label={lang === "hi" ? "छोड़े" : "SKIPPED"} value={result?.skipped ?? "—"} />
                <StatPill icon={Sparkles} label={lang === "hi" ? "परसेंट" : "PERCENT"} value={`${Math.round(Number(result?.percent ?? 0))}%`} />
              </div>

              {/* Leaderboard */}
              <div className="mt-6 rounded-3xl p-4 border border-black/10 dark:border-white/12 bg-black/3 dark:bg-white/[0.06]">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                    <div className="text-xs font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
                      {lang === "hi" ? "लीडरबोर्ड" : "LEADERBOARD"}
                    </div>
                  </div>

                  {result?.rank ? (
                    <div className="text-sm font-black text-slate-950 dark:text-white">
                      {lang === "hi" ? "आपका रैंक:" : "Your Rank:"} #{result.rank}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left min-w-[520px]">
                    <thead>
                      <tr className="text-[11px] tracking-[0.18em] font-extrabold text-slate-700 dark:text-white/60">
                        <th className="py-2 pr-3">{lang === "hi" ? "रैंक" : "RANK"}</th>
                        <th className="py-2 pr-3">{lang === "hi" ? "नाम" : "NAME"}</th>
                        <th className="py-2 pr-3">{lang === "hi" ? "स्कोर" : "SCORE"}</th>
                        <th className="py-2 pr-3">{lang === "hi" ? "समय" : "TIME"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leaderboard || []).slice(0, 20).map((row, i) => {
                        const r = row?.rank ?? (i + 1);
                        const name = row?.name ?? row?.studentName ?? "Student";
                        const score = row?.score ?? row?.marks ?? "—";
                        const time = row?.timeTakenSec ? `${Math.floor(row.timeTakenSec / 60)}m ${row.timeTakenSec % 60}s` : "—";
                        const isMe =
                          (row?.studentId && (row.studentId === user?._id || row.studentId === user?.id)) ||
                          (row?.email && row.email === user?.email);

                        return (
                          <tr
                            key={i}
                            className={cn(
                              "border-t border-black/8 dark:border-white/10",
                              isMe ? "bg-emerald-500/10" : ""
                            )}
                          >
                            <td className="py-3 pr-3 text-sm font-black text-slate-950 dark:text-white/90">
                              #{r}
                            </td>
                            <td className="py-3 pr-3 text-sm font-extrabold text-slate-900 dark:text-white/85">
                              {name} {isMe ? <span className="ml-2 text-[11px] font-black text-emerald-700 dark:text-emerald-300">(You)</span> : null}
                            </td>
                            <td className="py-3 pr-3 text-sm font-black text-slate-950 dark:text-white/90">
                              {score}
                            </td>
                            <td className="py-3 pr-3 text-sm font-semibold text-slate-700 dark:text-white/70">
                              {time}
                            </td>
                          </tr>
                        );
                      })}

                      {(!leaderboard || leaderboard.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-4 text-sm text-slate-700 dark:text-white/70">
                            {lang === "hi" ? "लीडरबोर्ड अभी उपलब्ध नहीं है" : "Leaderboard not available yet"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-[12px] text-slate-600 dark:text-white/60">
                  {lang === "hi"
                    ? "Note: Leaderboard backend से आता है।"
                    : "Note: Leaderboard is fetched from backend."}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
