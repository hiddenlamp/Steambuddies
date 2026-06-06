// src/pages/educator/NewCourse.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  ShieldCheck
} from "lucide-react";

import { api } from "../../api/axios";

/* ---------------- Helpers ---------------- */
const cn = (...s) => s.filter(Boolean).join(" ");
const toUpper = (v) => String(v || "").toUpperCase();

const emptyLS = () => ({ en: "", hi: "" });

const CATEGORIES = [
  { id: "robotics", name: { en: "Robotics", hi: "रोबोटिक्स" }, accent: "from-sky-500 via-indigo-500 to-fuchsia-500" },
  { id: "coding", name: { en: "Coding", hi: "कोडिंग" }, accent: "from-emerald-500 via-teal-500 to-cyan-500" },
  { id: "electronics", name: { en: "Electronics", hi: "इलेक्ट्रॉनिक्स" }, accent: "from-amber-500 via-orange-500 to-rose-500" },
  { id: "ai", name: { en: "AI", hi: "एआई" }, accent: "from-violet-500 via-fuchsia-500 to-pink-500" },
];

const GRADE_GROUPS = [
  { id: "g45", label: { en: "Class 4-5", hi: "कक्षा 4-5" } },
  { id: "g67", label: { en: "Class 6-7", hi: "कक्षा 6-7" } },
  { id: "g78", label: { en: "Class 7-8", hi: "कक्षा 7-8" } },
  { id: "g910", label: { en: "Class 9-10", hi: "कक्षा 9-10" } },
  { id: "g1112", label: { en: "Class 11-12", hi: "कक्षा 11-12" } },
];

const getCat = (id) => CATEGORIES.find((x) => x.id === id);
const getGrade = (id) => GRADE_GROUPS.find((x) => x.id === id);

const useEducatorTheme = () => ({
  pageBase: "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_25%),linear-gradient(180deg,#08111f_0%,#0b1325_45%,#120d20_100%)] text-white",
  glass: "border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.18)]",
  glassSoft: "border-white/10 bg-white/[0.04] backdrop-blur-lg",
  muted: "text-white/70",
  muted2: "text-white/55",
});

const createCourseApi = (payload) => {
  return api.post("/courses", payload);
};

/* ---------------- Small UI components ---------------- */
function AccentOrbs({ accent }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute -left-16 top-0 h-40 w-40 rounded-full blur-3xl opacity-20 bg-gradient-to-r", accent)} />
      <div className={cn("absolute right-0 top-0 h-44 w-44 rounded-full blur-3xl opacity-20 bg-gradient-to-r", accent)} />
    </div>
  );
}

function GhostBtn({ className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function SuccessBtn({ className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function Toast({ toast, onClose, glassSoft }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm font-semibold",
        glassSoft,
        isError ? "border-red-400/25 bg-red-500/10 text-red-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      )}
    >
      <span>{toast.msg}</span>
      <button onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs">
        Close
      </button>
    </div>
  );
}

function Field({ label, hint, muted2, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/65">{label}</div>
      {children}
      {hint ? <div className={cn("mt-2 text-[11px] font-semibold", muted2)}>{hint}</div> : null}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35",
        props.className
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35",
        props.className
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none",
        props.className
      )}
    />
  );
}

/* ---------------- Form shape ---------------- */
const emptyCourse = () => ({
  category: "robotics",
  gradeGroup: "g78",
  title: emptyLS(),
  level: "Beginner",
  duration: emptyLS(),
  meta: { lectures: 0, rating: 0, language: ["en", "hi"], certificate: true },
  skills: [],
  description: emptyLS(),
  includes: [emptyLS()],
  projects: [],
  curriculum: [{ title: emptyLS(), lessons: [{ title: emptyLS() }] }],
  videos: [{ title: emptyLS(), provider: "youtube", freePreview: true, url: "" }],
  badge: emptyLS(),
  status: "draft",
});

function normalizePayload(form, status) {
  const payload = {
    ...form,
    status,
    skills: (form.skills || []).map((x) => String(x || "").trim()).filter(Boolean),
    projects: (form.projects || []).map((x) => String(x || "").trim()).filter(Boolean),
    includes: (form.includes || []).filter((x) => (x?.en || "").trim() || (x?.hi || "").trim()),
    curriculum: (form.curriculum || [])
      .map((sec) => ({
        ...sec,
        lessons: (sec.lessons || []).filter(
          (l) => (l?.title?.en || "").trim() || (l?.title?.hi || "").trim()
        ),
      }))
      .filter(
        (sec) =>
          (sec?.title?.en || "").trim() ||
          (sec?.title?.hi || "").trim() ||
          (sec?.lessons?.length || 0) > 0
      ),
    videos: (form.videos || []).filter((v) => (v?.url || "").trim()),
  };

  payload.meta = payload.meta || {};
  payload.meta.lectures = payload.meta.lectures || payload.videos.length || 0;
  return payload;
}

/* ---------------- Page ---------------- */
export default function NewCourse() {
  const nav = useNavigate();
  const { pageBase, glass, glassSoft, muted, muted2 } = useEducatorTheme();

  const [form, setForm] = useState(() => emptyCourse());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("basic");

  const categories = useMemo(() => CATEGORIES, []);
  const grades = useMemo(() => GRADE_GROUPS, []);

  const cat = useMemo(() => getCat(form.category), [form.category]);
  const accent = cat?.accent || "from-sky-500 via-indigo-500 to-fuchsia-500";

  const setLS = (key, lang, val) =>
    setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  const addSkill = () => setForm((s) => ({ ...s, skills: [...(s.skills || []), ""] }));
  const addProject = () => setForm((s) => ({ ...s, projects: [...(s.projects || []), ""] }));
  const addInclude = () => setForm((s) => ({ ...s, includes: [...(s.includes || []), emptyLS()] }));
  const addSection = () =>
    setForm((s) => ({
      ...s,
      curriculum: [...(s.curriculum || []), { title: emptyLS(), lessons: [{ title: emptyLS() }] }],
    }));
  const addLesson = (secIdx) =>
    setForm((s) => {
      const curriculum = [...(s.curriculum || [])];
      const sec = curriculum[secIdx];
      if (!sec) return s;
      curriculum[secIdx] = { ...sec, lessons: [...(sec.lessons || []), { title: emptyLS() }] };
      return { ...s, curriculum };
    });
  const addVideo = () =>
    setForm((s) => ({
      ...s,
      videos: [...(s.videos || []), { title: emptyLS(), provider: "youtube", freePreview: false, url: "" }],
    }));

  const removeAt = (arrKey, idx) =>
    setForm((s) => ({ ...s, [arrKey]: (s[arrKey] || []).filter((_, i) => i !== idx) }));
  const removeSection = (idx) =>
    setForm((s) => ({ ...s, curriculum: (s.curriculum || []).filter((_, i) => i !== idx) }));
  const removeLesson = (secIdx, lessonIdx) =>
    setForm((s) => {
      const curriculum = [...(s.curriculum || [])];
      const sec = curriculum[secIdx];
      if (!sec) return s;
      curriculum[secIdx] = { ...sec, lessons: (sec.lessons || []).filter((_, i) => i !== lessonIdx) };
      return { ...s, curriculum };
    });

  const validate = (payload) => {
    const tEn = (payload?.title?.en || "").trim();
    const tHi = (payload?.title?.hi || "").trim();
    if (!tEn && !tHi) return "Title is required (EN or HI).";
    if (!payload.category) return "Category is required.";
    if (!payload.gradeGroup) return "Grade Group is required.";
    return "";
  };

  const save = async (status) => {
    setErr("");
    setToast(null);

    try {
      setSaving(true);
      const payload = normalizePayload(form, status);
      const vErr = validate(payload);

      if (vErr) {
        setErr(vErr);
        setToast({ type: "error", msg: vErr });
        return;
      }

      const res = await createCourseApi(payload);
      const ok = res?.data?.ok ?? true;

      if (ok) {
        setToast({
          type: "success",
          msg: status === "published" ? "✅ Course published." : "✅ Draft saved.",
        });
        nav("/educator/courses");
      } else {
        setErr("Failed to create course.");
        setToast({ type: "error", msg: "Failed to create course." });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error";
      setErr(msg);
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  const Tabs = [
    { id: "basic", label: "Basics" },
    { id: "content", label: "Content" },
    { id: "curriculum", label: "Curriculum" },
    { id: "videos", label: "Videos" },
  ];

  return (
    <div className={cn("min-h-screen", pageBase)}>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-8">
        <div className={cn("relative overflow-hidden rounded-3xl border p-6 md:p-10", glass)}>
          <AccentOrbs accent={accent} />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.22em] text-white/60 uppercase">
                Create Course
              </p>
              <h2 className="mt-2 text-[22px] md:text-[28px] font-black tracking-tight">
                Course Builder
              </h2>
              <p className={cn("mt-2 text-[13px] font-semibold", muted)}>
                Create first → later edit page me videos add karein. Published course student UI me show hoga.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <GhostBtn disabled={saving} onClick={() => save("draft")}>
                <Save className="h-4 w-4" /> Save Draft
              </GhostBtn>
              <SuccessBtn disabled={saving} onClick={() => save("published")}>
                <Send className="h-4 w-4" /> Publish
              </SuccessBtn>
              <GhostBtn type="button" onClick={() => nav("/educator/courses")}>
                <ArrowLeft className="h-4 w-4" /> Back
              </GhostBtn>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Toast toast={toast} onClose={() => setToast(null)} glassSoft={glassSoft} />
          {err ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] text-red-200 font-semibold">
              {err}
            </div>
          ) : null}
        </div>

        <div className={cn("mt-5 sticky top-2 z-20 rounded-2xl border p-2", glass)}>
          <div className="flex flex-wrap gap-2">
            {Tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-black transition",
                  tab === t.id ? "bg-white text-slate-900" : "text-white/70 hover:bg-white/10"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-5">
            {tab === "basic" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("rounded-3xl border p-5", glass)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category" muted2={muted2}>
                    <Select
                      value={form.category}
                      onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="text-black">
                          {c.name.en}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Grade Group" muted2={muted2}>
                    <Select
                      value={form.gradeGroup}
                      onChange={(e) => setForm((s) => ({ ...s, gradeGroup: e.target.value }))}
                    >
                      {grades.map((g) => (
                        <option key={g.id} value={g.id} className="text-black">
                          {g.label.en}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Title (EN)" muted2={muted2}>
                    <Input value={form.title.en} onChange={(e) => setLS("title", "en", e.target.value)} />
                  </Field>

                  <Field label="Title (HI)" muted2={muted2}>
                    <Input value={form.title.hi} onChange={(e) => setLS("title", "hi", e.target.value)} />
                  </Field>

                  <Field label="Level" muted2={muted2}>
                    <Input
                      value={form.level}
                      onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}
                    />
                  </Field>

                  <Field label="Lectures (count)" muted2={muted2}>
                    <Input
                      type="number"
                      value={form.meta.lectures}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          meta: { ...s.meta, lectures: Number(e.target.value || 0) },
                        }))
                      }
                    />
                  </Field>

                  <Field label="Duration (EN)" muted2={muted2}>
                    <Input value={form.duration.en} onChange={(e) => setLS("duration", "en", e.target.value)} />
                  </Field>

                  <Field label="Duration (HI)" muted2={muted2}>
                    <Input value={form.duration.hi} onChange={(e) => setLS("duration", "hi", e.target.value)} />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Description (EN)" muted2={muted2}>
                    <Textarea
                      value={form.description.en}
                      onChange={(e) => setLS("description", "en", e.target.value)}
                      className="min-h-[120px]"
                    />
                  </Field>
                  <Field label="Description (HI)" muted2={muted2}>
                    <Textarea
                      value={form.description.hi}
                      onChange={(e) => setLS("description", "hi", e.target.value)}
                      className="min-h-[120px]"
                    />
                  </Field>
                </div>
              </motion.div>
            )}

            {tab === "content" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className={cn("rounded-3xl border p-5", glass)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black">Skills</div>
                      <div className={cn("text-xs font-semibold", muted2)}>These show in Student Skills Snapshot.</div>
                    </div>
                    <GhostBtn onClick={addSkill} className="text-[12px] px-3 py-2">
                      <Plus className="h-4 w-4" /> Add
                    </GhostBtn>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(form.skills || []).map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={s}
                          onChange={(e) =>
                            setForm((prev) => {
                              const skills = [...(prev.skills || [])];
                              skills[i] = e.target.value;
                              return { ...prev, skills };
                            })
                          }
                        />
                        <button
                          onClick={() => removeAt("skills", i)}
                          className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn("rounded-3xl border p-5", glass)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black">Includes</div>
                    </div>
                    <GhostBtn onClick={addInclude} className="text-[12px] px-3 py-2">
                      <Plus className="h-4 w-4" /> Add
                    </GhostBtn>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(form.includes || []).map((inc, i) => (
                      <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_44px]">
                        <Input
                          value={inc.en}
                          onChange={(e) =>
                            setForm((prev) => {
                              const includes = [...(prev.includes || [])];
                              includes[i] = { ...(includes[i] || emptyLS()), en: e.target.value };
                              return { ...prev, includes };
                            })
                          }
                          placeholder="Include (EN)"
                        />
                        <Input
                          value={inc.hi}
                          onChange={(e) =>
                            setForm((prev) => {
                              const includes = [...(prev.includes || [])];
                              includes[i] = { ...(includes[i] || emptyLS()), hi: e.target.value };
                              return { ...prev, includes };
                            })
                          }
                          placeholder="Include (HI)"
                        />
                        <button
                          onClick={() => removeAt("includes", i)}
                          className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn("rounded-3xl border p-5", glass)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black">Projects</div>
                    </div>
                    <GhostBtn onClick={addProject} className="text-[12px] px-3 py-2">
                      <Plus className="h-4 w-4" /> Add
                    </GhostBtn>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(form.projects || []).map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={p}
                          onChange={(e) =>
                            setForm((prev) => {
                              const projects = [...(prev.projects || [])];
                              projects[i] = e.target.value;
                              return { ...prev, projects };
                            })
                          }
                        />
                        <button
                          onClick={() => removeAt("projects", i)}
                          className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "curriculum" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-5", glass)}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black">Curriculum</div>
                  </div>
                  <GhostBtn onClick={addSection} className="text-[12px] px-3 py-2">
                    <Plus className="h-4 w-4" /> Add Section
                  </GhostBtn>
                </div>

                <div className="mt-4 space-y-4">
                  {(form.curriculum || []).map((sec, sidx) => (
                    <div key={sidx} className={cn("rounded-3xl border p-4", glassSoft)}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid gap-2 md:grid-cols-2">
                          <Input
                            value={sec?.title?.en || ""}
                            onChange={(e) =>
                              setForm((prev) => {
                                const curriculum = [...(prev.curriculum || [])];
                                const curSec = curriculum[sidx] || { title: emptyLS(), lessons: [] };
                                curriculum[sidx] = { ...curSec, title: { ...(curSec.title || emptyLS()), en: e.target.value } };
                                return { ...prev, curriculum };
                              })
                            }
                            placeholder="Section title (EN)"
                          />
                          <Input
                            value={sec?.title?.hi || ""}
                            onChange={(e) =>
                              setForm((prev) => {
                                const curriculum = [...(prev.curriculum || [])];
                                const curSec = curriculum[sidx] || { title: emptyLS(), lessons: [] };
                                curriculum[sidx] = { ...curSec, title: { ...(curSec.title || emptyLS()), hi: e.target.value } };
                                return { ...prev, curriculum };
                              })
                            }
                            placeholder="Section title (HI)"
                          />
                        </div>

                        <button
                          onClick={() => removeSection(sidx)}
                          className="rounded-2xl px-3 py-2 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Lessons</div>
                        <GhostBtn onClick={() => addLesson(sidx)} className="text-[12px] px-3 py-2">
                          <Plus className="h-4 w-4" /> Add Lesson
                        </GhostBtn>
                      </div>

                      <div className="mt-3 space-y-2">
                        {(sec.lessons || []).map((l, lidx) => (
                          <div key={lidx} className="grid gap-2 md:grid-cols-[1fr_1fr_44px]">
                            <Input
                              value={l?.title?.en || ""}
                              onChange={(e) =>
                                setForm((prev) => {
                                  const curriculum = [...(prev.curriculum || [])];
                                  const lessons = [...(curriculum[sidx]?.lessons || [])];
                                  const curL = lessons[lidx] || { title: emptyLS() };
                                  lessons[lidx] = { ...curL, title: { ...(curL.title || emptyLS()), en: e.target.value } };
                                  curriculum[sidx] = { ...(curriculum[sidx] || { title: emptyLS() }), lessons };
                                  return { ...prev, curriculum };
                                })
                              }
                              placeholder="Lesson (EN)"
                            />
                            <Input
                              value={l?.title?.hi || ""}
                              onChange={(e) =>
                                setForm((prev) => {
                                  const curriculum = [...(prev.curriculum || [])];
                                  const lessons = [...(curriculum[sidx]?.lessons || [])];
                                  const curL = lessons[lidx] || { title: emptyLS() };
                                  lessons[lidx] = { ...curL, title: { ...(curL.title || emptyLS()), hi: e.target.value } };
                                  curriculum[sidx] = { ...(curriculum[sidx] || { title: emptyLS() }), lessons };
                                  return { ...prev, curriculum };
                                })
                              }
                              placeholder="Lesson (HI)"
                            />
                            <button
                              onClick={() => removeLesson(sidx, lidx)}
                              className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4 text-red-200" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "videos" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-5", glass)}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black">Videos</div>
                  </div>

                  <GhostBtn onClick={addVideo} className="text-[12px] px-3 py-2">
                    <Plus className="h-4 w-4" /> Add Video
                  </GhostBtn>
                </div>

                <div className="mt-4 space-y-4">
                  {(form.videos || []).map((v, i) => (
                    <div key={i} className={cn("rounded-3xl border p-4", glassSoft)}>
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          value={v?.title?.en || ""}
                          onChange={(e) =>
                            setForm((prev) => {
                              const videos = [...(prev.videos || [])];
                              videos[i] = { ...videos[i], title: { ...(videos[i].title || emptyLS()), en: e.target.value } };
                              return { ...prev, videos };
                            })
                          }
                          placeholder="Video title (EN)"
                        />
                        <Input
                          value={v?.title?.hi || ""}
                          onChange={(e) =>
                            setForm((prev) => {
                              const videos = [...(prev.videos || [])];
                              videos[i] = { ...videos[i], title: { ...(videos[i].title || emptyLS()), hi: e.target.value } };
                              return { ...prev, videos };
                            })
                          }
                          placeholder="Video title (HI)"
                        />
                      </div>

                      <div className="mt-2 grid gap-2 md:grid-cols-[160px_1fr_44px]">
                        <Select
                          value={v.provider || "youtube"}
                          onChange={(e) =>
                            setForm((prev) => {
                              const videos = [...(prev.videos || [])];
                              videos[i] = { ...videos[i], provider: e.target.value };
                              return { ...prev, videos };
                            })
                          }
                        >
                          <option value="youtube" className="text-black">YouTube</option>
                          <option value="vimeo" className="text-black">Vimeo</option>
                          <option value="file" className="text-black">File</option>
                          <option value="other" className="text-black">Other</option>
                        </Select>

                        <Input
                          value={v.url || ""}
                          onChange={(e) =>
                            setForm((prev) => {
                              const videos = [...(prev.videos || [])];
                              videos[i] = { ...videos[i], url: e.target.value };
                              return { ...prev, videos };
                            })
                          }
                          placeholder="Video URL"
                        />

                        <button
                          onClick={() => removeAt("videos", i)}
                          className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>

                      <label className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-white/70">
                        <input
                          type="checkbox"
                          checked={!!v.freePreview}
                          onChange={(e) =>
                            setForm((prev) => {
                              const videos = [...(prev.videos || [])];
                              videos[i] = { ...videos[i], freePreview: e.target.checked };
                              return { ...prev, videos };
                            })
                          }
                        />
                        Free Preview
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <aside className="space-y-5">
            <div className={cn("rounded-3xl border p-5", glass)}>
              <div className="flex items-start gap-3">
                <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", glassSoft)}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black">Student Preview Summary</div>
                  <div className={cn("mt-1 text-xs font-semibold", muted2)}>
                    Publish karte hi student UI me show.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className={cn("rounded-2xl border p-3", glassSoft)}>
                  <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Title</div>
                  <div className="mt-1 text-sm font-black truncate">
                    {form.title.en || form.title.hi || "Untitled"}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className={cn("rounded-2xl border p-3", glassSoft)}>
                    <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Category</div>
                    <div className="mt-1 text-sm font-black truncate">
                      {getCat(form.category)?.name?.en ?? form.category}
                    </div>
                  </div>
                  <div className={cn("rounded-2xl border p-3", glassSoft)}>
                    <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Grade</div>
                    <div className="mt-1 text-sm font-black truncate">
                      {getGrade(form.gradeGroup)?.label?.en ?? form.gradeGroup}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div className={cn("rounded-2xl border p-3", glassSoft)}>
                    <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Skills</div>
                    <div className="mt-1 text-sm font-black">{(form.skills || []).filter(Boolean).length}</div>
                  </div>
                  <div className={cn("rounded-2xl border p-3", glassSoft)}>
                    <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Modules</div>
                    <div className="mt-1 text-sm font-black">{(form.curriculum || []).length}</div>
                  </div>
                  <div className={cn("rounded-2xl border p-3", glassSoft)}>
                    <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Videos</div>
                    <div className="mt-1 text-sm font-black">
                      {(form.videos || []).filter((v) => (v?.url || "").trim()).length}
                    </div>
                  </div>
                </div>

                <div className={cn("rounded-2xl border p-3", glassSoft)}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className={cn("text-xs font-extrabold tracking-[0.18em] uppercase", muted2)}>Status</div>
                      <div className="mt-1 text-sm font-black">{toUpper(form.status || "draft")}</div>
                    </div>
                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", glassSoft)}>
                      <ShieldCheck className="h-4 w-4" />
                      <span className={cn("font-semibold", muted)}>
                        {form?.meta?.certificate ? "Certificate" : "No Certificate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}