// src/pages/educator/mocktests/MockTestCreate.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wand2,
  Save,
  CheckSquare,
  Square,
  Trash2,
  Loader2,
} from "lucide-react";

import educatorApi from "../../api/educator.api";
import { getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

const toISO = (dtLocalStr) => {
  if (!dtLocalStr) return null;
  const d = new Date(dtLocalStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const clamp = (n, a, b) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
};

// helper: support both axios-response OR data-only
const unwrap = (res) => res?.data ?? res;

export default function MockTestCreate() {
  const nav = useNavigate();

  // ===== Form =====
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topicsText, setTopicsText] = useState("");
  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState("medium");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [startAtLocal, setStartAtLocal] = useState("");
  const [endAtLocal, setEndAtLocal] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [instructions, setInstructions] = useState("");

  // ✅ Need testId before generate
  const [testId, setTestId] = useState("");

  // ===== Generate =====
  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [generated, setGenerated] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ===== Save =====
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const topics = useMemo(() => {
    return topicsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [topicsText]);

  const selectedQuestions = useMemo(() => {
    const ids = selectedIds;
    return (generated || []).filter((q) => ids.has(q.id));
  }, [generated, selectedIds]);

  const validateCore = () => {
    if (!title.trim()) return "Title required";
    if (!subject.trim()) return "Subject required";
    if (topics.length === 0) return "At least 1 topic required";
    return "";
  };

  const validateBeforeGenerate = () => {
    const core = validateCore();
    if (core) return core;
    if (!totalQuestions || Number(totalQuestions) < 1)
      return "Total questions must be >= 1";
    return "";
  };

  const normalizeItems = (items) => {
    const arr = Array.isArray(items) ? items : [];
    return arr.map((x, i) => ({
      id: x.id || x._id || `q_${Date.now()}_${i}`,
      topic: x.topic || x.tags?.[0] || topics[0] || "",
      question: x.question || x.prompt || "",
      options: Array.isArray(x.options) ? x.options : [],
      correctIndex: Number.isFinite(Number(x.correctIndex))
        ? Number(x.correctIndex)
        : 0,
      explanation: x.explanation || "",
    }));
  };

 const pickItems = (res) => {
  // NOTE: aapke axios.js me response interceptor response.data return karta hai,
  // so "res" most likely already plain object hai.
  const candidates = [
    res?.items,
    res?.data?.items,       // if kabhi wrapper aa jaye
    res?.result?.items,
    res?.payload?.items,
    res,                    // if API returns array directly
    res?.data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};


  // ✅ Create draft test if not already created
    const ensureDraftTest = async () => {
  if (testId) return testId;

  const core = validateCore();
  if (core) throw new Error(core);

  const res = await educatorApi.post("/mock-tests", {
    title,
    subject,
    topics,
    language,
    difficulty,
    durationMinutes: clamp(durationMinutes, 1, 300),
    startAt: toISO(startAtLocal),
    endAt: toISO(endAtLocal),
    negativeMarking,
    instructions,
    status: "draft",
  });

  // ⚠️ IMPORTANT — axios already returns data
  const id = res?._id || res?.id;

  if (!id) {
    console.log("Create draft response =", res);
    throw new Error("Failed to create draft test");
  }

  setTestId(id);
  return id;
};


  // ✅ Generate Questions (requires :id)
   const generateQuestions = async () => {
  const v = validateBeforeGenerate();
  if (v) {
    setGenErr(v);
    return;
  }

  setGenLoading(true);
  setGenErr("");

  try {
    const id = await ensureDraftTest();

    const res = await educatorApi.post(`/mock-tests/${id}/generate-questions`, {
      subject,
      topics,
      totalQuestions: clamp(totalQuestions, 1, 100),
      difficulty,
      language,
    });

    const items = pickItems(res);
    const normalized = normalizeItems(items);

    setGenerated(normalized);
    setSelectedIds(new Set(normalized.map((x) => x.id))); // select all
  } catch (e) {
    setGenErr(getApiError(e) || e?.message || "Question generation failed");
    setGenerated([]);
    setSelectedIds(new Set());
  } finally {
    setGenLoading(false);
  }
};
  const toggleSelectAll = () => {
    if (!generated.length) return;
    const allSelected = selectedIds.size === generated.length;
    setSelectedIds(allSelected ? new Set() : new Set(generated.map((x) => x.id)));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeOne = (id) => {
    setGenerated((prev) => prev.filter((x) => x.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // ✅ Save Draft: update fields + append selected questions
  const saveMockTest = async () => {
    setSaveErr("");

    const core = validateCore();
    if (core) return setSaveErr(core);

    if (selectedQuestions.length === 0)
      return setSaveErr("Select at least 1 question");

    setSaving(true);
    try {
      const id = await ensureDraftTest();

      // update test meta
      await educatorApi.patch(`/mock-tests/${id}`, {
        title,
        subject,
        topics,
        language,
        difficulty,
        durationMinutes: clamp(durationMinutes, 1, 300),
        totalQuestions: selectedQuestions.length,
        startAt: toISO(startAtLocal),
        endAt: toISO(endAtLocal),
        negativeMarking,
        instructions,
      });

      // append questions
      await educatorApi.post(`/mock-tests/${id}/questions/append`, {
        items: selectedQuestions.map((q) => ({
          topic: q.topic,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      });

      nav(`/educator/mock-tests/${id}`);
    } catch (e) {
      setSaveErr(getApiError(e) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => nav("/educator/mock-tests")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          onClick={saveMockTest}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white font-semibold",
            saving ? "bg-emerald-500/60" : "bg-emerald-500 hover:bg-emerald-600"
          )}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Draft
        </button>
      </div>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-xl md:text-2xl font-extrabold text-white">Create Mock Test</h1>
        <p className="text-white/70 text-sm mt-1">
          Fill details → Generate questions → Select questions → Save draft.
        </p>

        {testId ? (
          <div className="mt-2 text-xs text-white/70">
            Draft created: <span className="text-white font-semibold">{testId}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: FORM */}
        <div className="lg:col-span-5 rounded-2xl bg-white/5 border border-white/10 p-4">
          <h2 className="text-white font-bold">Test Details</h2>

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-white/70 text-sm">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Class 9 Science - Weekly Test"
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Science / Maths / English"
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm">Topics (comma separated)</label>
              <input
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder="e.g., Motion, Force, Gravitation"
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
              />
              {topics.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-xl bg-white/10 text-white/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mix">Hinglish (mix)</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 text-sm">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm">Duration (minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  min={1}
                  max={300}
                />
              </div>

              <div>
                <label className="text-white/70 text-sm">Generate Questions</label>
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm">Start At</label>
                <input
                  type="datetime-local"
                  value={startAtLocal}
                  onChange={(e) => setStartAtLocal(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm">End At</label>
                <input
                  type="datetime-local"
                  value={endAtLocal}
                  onChange={(e) => setEndAtLocal(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-white/80 text-sm">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
              />
              Enable negative marking
            </label>

            <div>
              <label className="text-white/70 text-sm">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="e.g., No switching tabs, each question has 1 correct option..."
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            {saveErr ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
                {saveErr}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT: GENERATE + SELECT */}
        <div className="lg:col-span-7 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-white font-bold">Questions (ChatGPT Generated)</h2>

            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 text-white"
              >
                {selectedIds.size === generated.length && generated.length ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                Select All
              </button>

              <button
                onClick={generateQuestions}
                disabled={genLoading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-white font-semibold",
                  genLoading ? "bg-indigo-500/60" : "bg-indigo-500 hover:bg-indigo-600"
                )}
              >
                {genLoading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                Generate
              </button>
            </div>
          </div>

          {genErr ? (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
              {genErr}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {generated.length === 0 ? (
              <div className="text-white/70 text-sm">
                No questions yet. Fill <b>Title + Subject + Topics</b> and click <b>Generate</b>.
              </div>
            ) : null}

            {generated.map((q, idx) => {
              const checked = selectedIds.has(q.id);
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.01 }}
                  className={cn(
                    "rounded-2xl border p-4",
                    checked
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => toggleOne(q.id)}
                      className="mt-1 shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white"
                      title="Select"
                    >
                      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-xl bg-white/10 text-white/90">
                          Q{idx + 1}
                        </span>
                        {q.topic ? (
                          <span className="text-xs px-2 py-1 rounded-xl bg-white/10 text-white/90">
                            {q.topic}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-white font-semibold leading-snug">{q.question}</p>

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
                            <span className="text-white/60 mr-2">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {op}
                          </div>
                        ))}
                      </div>

                      {q.explanation ? (
                        <p className="mt-2 text-white/70 text-sm">
                          <span className="font-semibold text-white/80">Explanation:</span>{" "}
                          {q.explanation}
                        </p>
                      ) : null}
                    </div>

                    <button
                      onClick={() => removeOne(q.id)}
                      className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/20 text-white"
                      title="Remove question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {generated.length ? (
            <div className="mt-4 text-white/70 text-sm">
              Selected: <b className="text-white">{selectedQuestions.length}</b> /{" "}
              {generated.length}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
