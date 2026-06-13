// src/pages/educator/CourseEdit.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Send, Plus, Trash2, ClipboardEdit, RefreshCw, Trash } from "lucide-react";
import {
  getMyCourseApi,
  updateCourseApi,
  patchCourseApi,
  deleteCourseApi,
} from "../../api/courses.api";
import { CATEGORIES, GRADE_GROUPS } from "./courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");
const emptyLS = () => ({ en: "", hi: "" });

const useEducatorTheme = () => ({
  pageBase: "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_25%),linear-gradient(180deg,#08111f_0%,#0b1325_45%,#120d20_100%)] text-white",
  glass: "border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.18)]",
  glassSoft: "border-white/10 bg-white/[0.04] backdrop-blur-lg",
  muted: "text-white/70",
  muted2: "text-white/55",
});

function Field({ label, hint, muted2, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/65">{label}</div>
      {children}
      {hint && <div className={cn("mt-2 text-[11px] font-semibold", muted2)}>{hint}</div>}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35 transition focus:border-white/20 focus:bg-black/40",
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
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none transition focus:border-white/20 focus:bg-black/40",
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
        "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35 transition focus:border-white/20 focus:bg-black/40",
        props.className
      )}
    />
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

function DangerBtn({ className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/15 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function normalizeForm(c) {
  return {
    category: c?.category ?? "robotics",
    gradeGroup: c?.gradeGroup ?? "c6",
    title: c?.title ?? emptyLS(),
    level: c?.level ?? "Beginner",
    duration: c?.duration ?? emptyLS(),
    meta: c?.meta ?? { lectures: 0, rating: 0, language: ["en", "hi"], certificate: true },
    skills: Array.isArray(c?.skills) ? c.skills : [],
    description: c?.description ?? emptyLS(),
    includes: Array.isArray(c?.includes) ? c.includes : c?.includes ? [c.includes] : [emptyLS()],
    projects: Array.isArray(c?.projects) ? c.projects : [],
    curriculum: Array.isArray(c?.curriculum) ? c.curriculum : [],
    videos: Array.isArray(c?.videos) ? c.videos : [],
    badge: c?.badge ?? emptyLS(),
    status: c?.status ?? "draft",
  };
}

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

export default function CourseEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const { pageBase, glass, glassSoft, muted, muted2 } = useEducatorTheme();

  const categories = useMemo(() => CATEGORIES, []);
  const grades = useMemo(() => GRADE_GROUPS, []);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("basic");

  const fetchOne = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await getMyCourseApi(id);
      const c = res?.data?.data ?? res?.data?.course ?? res?.data;
      setForm(normalizeForm(c));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load course");
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
  }, [id]);

  const setLS = (key, lang, val) => setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  // Handlers
  const addSkill = () => setForm((s) => ({ ...s, skills: [...(s.skills || []), ""] }));
  const removeAt = (arrKey, idx) => setForm((s) => ({ ...s, [arrKey]: (s[arrKey] || []).filter((_, i) => i !== idx) }));
  
  const addInclude = () => setForm((s) => ({ ...s, includes: [...(s.includes || []), emptyLS()] }));
  const addProject = () => setForm((s) => ({ ...s, projects: [...(s.projects || []), ""] }));

  const addSection = () => setForm((s) => ({ ...s, curriculum: [...(s.curriculum || []), { title: emptyLS(), lessons: [{ title: emptyLS() }] }] }));
  const removeSection = (idx) => setForm((s) => ({ ...s, curriculum: (s.curriculum || []).filter((_, i) => i !== idx) }));
  const addLesson = (secIdx) => setForm((s) => {
    const cur = [...(s.curriculum || [])];
    if(cur[secIdx]) cur[secIdx] = { ...cur[secIdx], lessons: [...(cur[secIdx].lessons || []), { title: emptyLS() }] };
    return { ...s, curriculum: cur };
  });
  const removeLesson = (secIdx, lessonIdx) => setForm((s) => {
    const cur = [...(s.curriculum || [])];
    if(cur[secIdx]) cur[secIdx] = { ...cur[secIdx], lessons: (cur[secIdx].lessons || []).filter((_, i) => i !== lessonIdx) };
    return { ...s, curriculum: cur };
  });

  const addVideo = () => setForm((s) => ({ ...s, videos: [...(s.videos || []), { title: emptyLS(), provider: "youtube", freePreview: false, url: "" }] }));
  const removeVideo = (idx) => setForm((s) => ({ ...s, videos: (s.videos || []).filter((_, i) => i !== idx) }));

  const validate = (payload) => {
    const tEn = (payload?.title?.en || "").trim();
    const tHi = (payload?.title?.hi || "").trim();
    if (!tEn && !tHi) return "Title is required (EN or HI).";
    return "";
  };

  const saveFull = async (status) => {
    if (!form) return;
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

      await updateCourseApi(id, payload);
      setToast({ type: "success", msg: status === "published" ? "✅ Updated & Published." : "✅ Updated Draft." });
      await fetchOne();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Update failed";
      setErr(msg);
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this course?")) return;
    try {
      await deleteCourseApi(id);
      nav("/educator/courses");
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.message || e?.message || "Delete failed" });
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen", pageBase)}>
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
          <div className={cn("rounded-3xl border p-6 font-semibold", glass, muted)}>Loading Course...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={cn("min-h-screen", pageBase)}>
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 space-y-3">
          <div className="rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-200 font-semibold">{err || "Course not found."}</div>
          <GhostBtn onClick={() => nav("/educator/courses")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </GhostBtn>
        </div>
      </div>
    );
  }

  const Tabs = [
    { id: "basic", label: "Basic Info & Metadata" },
    { id: "curriculum", label: "Curriculum Builder" },
    { id: "videos", label: "Video Lectures" },
  ];

  return (
    <div className={cn("min-h-screen pb-16", pageBase)}>
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-8">
        
        {/* Header */}
        <div className={cn("overflow-hidden rounded-3xl border p-6 md:p-8", glass)}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.22em] text-white/60 uppercase">Course Studio</p>
              <h2 className="mt-2 text-[24px] md:text-[32px] font-black tracking-tight flex items-center gap-3">
                <ClipboardEdit className="h-7 w-7 text-sky-400" />
                {form.title?.en || form.title?.hi || "Untitled Course"}
              </h2>
              <p className={cn("mt-2 text-[14px] font-semibold", muted)}>
                Manage your course details, curriculum, and lectures. Changes must be saved to apply.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <GhostBtn onClick={() => nav("/educator/courses")} title="Back">
                <ArrowLeft className="h-4 w-4" /> Back
              </GhostBtn>
              <GhostBtn onClick={fetchOne} title="Reload">
                <RefreshCw className="h-4 w-4" />
              </GhostBtn>
              <DangerBtn onClick={onDelete}>
                <Trash className="h-4 w-4" />
              </DangerBtn>

              <GhostBtn disabled={saving} onClick={() => saveFull("draft")} className="ml-2">
                <Save className="h-4 w-4" /> Save Draft
              </GhostBtn>
              <SuccessBtn disabled={saving} onClick={() => saveFull("published")}>
                <Send className="h-4 w-4" /> Publish
              </SuccessBtn>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-4 space-y-3">
          {toast && (
            <div className={cn("flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm font-semibold", glassSoft, toast.type === "error" ? "border-red-400/25 bg-red-500/10 text-red-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200")}>
              <span>{toast.msg}</span>
              <button onClick={() => setToast(null)} className="rounded-lg border border-white/10 px-2 py-1 text-xs">Close</button>
            </div>
          )}
          {err && (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[13px] text-red-200 font-semibold">{err}</div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className={cn("mt-6 sticky top-2 z-20 rounded-2xl border p-2 flex overflow-x-auto gap-2 scrollbar-hide", glass)}>
          {Tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-5 py-2.5 text-[14px] font-black transition",
                tab === t.id ? "bg-white text-slate-900 shadow-md" : "text-white/70 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          
          {/* TAB: BASICS */}
          {tab === "basic" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className={cn("rounded-3xl border p-6 md:p-8", glassSoft)}>
                <h3 className="text-lg font-black mb-6">Course Information</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Category" muted2={muted2}>
                    <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
                      {categories.map((c) => <option key={c.id} value={c.id} className="text-black">{c.name.en}</option>)}
                    </Select>
                  </Field>
                  <Field label="Class" muted2={muted2}>
                    <Select value={form.gradeGroup} onChange={(e) => setForm((s) => ({ ...s, gradeGroup: e.target.value }))}>
                      {grades.map((g) => <option key={g.id} value={g.id} className="text-black">{g.label.en}</option>)}
                    </Select>
                  </Field>
                  <Field label="Title (English)">
                    <Input value={form.title.en} onChange={(e) => setLS("title", "en", e.target.value)} />
                  </Field>
                  <Field label="Title (Hindi)">
                    <Input value={form.title.hi} onChange={(e) => setLS("title", "hi", e.target.value)} />
                  </Field>
                  <Field label="Level">
                    <Select value={form.level} onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}>
                      <option value="Beginner" className="text-black">Beginner</option>
                      <option value="Intermediate" className="text-black">Intermediate</option>
                      <option value="Advanced" className="text-black">Advanced</option>
                    </Select>
                  </Field>
                  <Field label="Duration Label">
                    <div className="flex gap-2">
                      <Input value={form.duration.en} onChange={(e) => setLS("duration", "en", e.target.value)} placeholder="EN (e.g. 10 hours)" />
                      <Input value={form.duration.hi} onChange={(e) => setLS("duration", "hi", e.target.value)} placeholder="HI" />
                    </div>
                  </Field>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Field label="Description (English)">
                    <Textarea value={form.description.en} onChange={(e) => setLS("description", "en", e.target.value)} className="min-h-[100px]" />
                  </Field>
                  <Field label="Description (Hindi)">
                    <Textarea value={form.description.hi} onChange={(e) => setLS("description", "hi", e.target.value)} className="min-h-[100px]" />
                  </Field>
                </div>
              </div>

              {/* Extras: Skills, Includes, Projects */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Skills */}
                <div className={cn("rounded-3xl border p-5", glassSoft)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-black">Skills</div>
                    <GhostBtn onClick={addSkill} className="px-2 py-1.5 text-xs"><Plus className="h-4 w-4" /> Add</GhostBtn>
                  </div>
                  <div className="space-y-2">
                    {(form.skills || []).map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={s} onChange={(e) => { const arr = [...form.skills]; arr[i] = e.target.value; setForm((prev) => ({...prev, skills: arr})) }} placeholder="e.g. UI Design" />
                        <button onClick={() => removeAt("skills", i)} className="rounded-2xl px-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Includes */}
                <div className={cn("rounded-3xl border p-5", glassSoft)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-black">Includes</div>
                    <GhostBtn onClick={addInclude} className="px-2 py-1.5 text-xs"><Plus className="h-4 w-4" /> Add</GhostBtn>
                  </div>
                  <div className="space-y-2">
                    {(form.includes || []).map((inc, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <Input value={inc.en} onChange={(e) => { const arr = [...form.includes]; arr[i] = {...arr[i], en: e.target.value}; setForm((prev) => ({...prev, includes: arr})) }} placeholder="EN" />
                          <Input value={inc.hi} onChange={(e) => { const arr = [...form.includes]; arr[i] = {...arr[i], hi: e.target.value}; setForm((prev) => ({...prev, includes: arr})) }} placeholder="HI" />
                        </div>
                        <button onClick={() => removeAt("includes", i)} className="rounded-2xl px-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className={cn("rounded-3xl border p-5", glassSoft)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-black">Projects</div>
                    <GhostBtn onClick={addProject} className="px-2 py-1.5 text-xs"><Plus className="h-4 w-4" /> Add</GhostBtn>
                  </div>
                  <div className="space-y-2">
                    {(form.projects || []).map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={p} onChange={(e) => { const arr = [...form.projects]; arr[i] = e.target.value; setForm((prev) => ({...prev, projects: arr})) }} placeholder="e.g. Chat App" />
                        <button onClick={() => removeAt("projects", i)} className="rounded-2xl px-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: CURRICULUM */}
          {tab === "curriculum" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-6 md:p-8", glassSoft)}>
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black">Course Curriculum</h3>
                  <p className={cn("mt-1 text-[13px]", muted)}>Organize your course into sections and add lectures inside them.</p>
                </div>
                <GhostBtn onClick={addSection} className="px-4 py-2"><Plus className="h-5 w-5" /> Add Section</GhostBtn>
              </div>

              {form.curriculum?.length === 0 && (
                <div className="text-center py-10 border border-dashed border-white/20 rounded-3xl bg-white/5">
                  <p className="font-semibold text-white/50 mb-4">No sections added yet.</p>
                  <GhostBtn onClick={addSection}><Plus className="h-4 w-4"/> Create First Section</GhostBtn>
                </div>
              )}

              <div className="space-y-6">
                {(form.curriculum || []).map((sec, sidx) => (
                  <div key={sidx} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/10 rounded-xl h-10 w-10 flex items-center justify-center font-black">{sidx + 1}</div>
                      <div className="flex-1 grid gap-3 md:grid-cols-2">
                        <Input value={sec?.title?.en || ""} onChange={(e) => { const arr = [...form.curriculum]; arr[sidx].title.en = e.target.value; setForm(p=>({...p, curriculum:arr})) }} placeholder="Section Title (EN)" />
                        <Input value={sec?.title?.hi || ""} onChange={(e) => { const arr = [...form.curriculum]; arr[sidx].title.hi = e.target.value; setForm(p=>({...p, curriculum:arr})) }} placeholder="Section Title (HI)" />
                      </div>
                      <button onClick={() => removeSection(sidx)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"><Trash2 className="h-5 w-5" /></button>
                    </div>

                    <div className="mt-5 pl-14">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-black uppercase tracking-widest text-white/50">Lectures</span>
                        <button onClick={() => addLesson(sidx)} className="text-sky-300 text-[13px] font-bold flex items-center gap-1 hover:text-sky-200"><Plus className="h-4 w-4"/> Add Lecture</button>
                      </div>
                      
                      <div className="space-y-2">
                        {(sec.lessons || []).map((l, lidx) => (
                          <div key={lidx} className="flex items-center gap-3 bg-white/5 p-2 pr-3 rounded-2xl border border-white/5">
                            <div className="text-white/30 font-bold w-6 text-right text-xs">{lidx + 1}.</div>
                            <div className="flex-1 grid gap-2 md:grid-cols-2">
                              <Input value={l?.title?.en || ""} onChange={(e) => { const arr = [...form.curriculum]; arr[sidx].lessons[lidx].title.en = e.target.value; setForm(p=>({...p, curriculum:arr})) }} placeholder="Lecture (EN)" className="py-2 text-xs" />
                              <Input value={l?.title?.hi || ""} onChange={(e) => { const arr = [...form.curriculum]; arr[sidx].lessons[lidx].title.hi = e.target.value; setForm(p=>({...p, curriculum:arr})) }} placeholder="Lecture (HI)" className="py-2 text-xs" />
                            </div>
                            <button onClick={() => removeLesson(sidx, lidx)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: VIDEOS */}
          {tab === "videos" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-6 md:p-8", glassSoft)}>
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black">Video Management</h3>
                  <p className={cn("mt-1 text-[13px]", muted)}>Add video links for the course. These will appear in the player.</p>
                </div>
                <GhostBtn onClick={addVideo} className="px-4 py-2"><Plus className="h-5 w-5" /> Add Video</GhostBtn>
              </div>

              <div className="space-y-4">
                {(form.videos || []).map((v, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      <Input value={v?.title?.en || ""} onChange={(e) => { const arr = [...form.videos]; arr[i].title.en = e.target.value; setForm(p=>({...p, videos:arr})) }} placeholder="Video Title (EN)" />
                      <Input value={v?.title?.hi || ""} onChange={(e) => { const arr = [...form.videos]; arr[i].title.hi = e.target.value; setForm(p=>({...p, videos:arr})) }} placeholder="Video Title (HI)" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-[150px_1fr_50px]">
                      <Select value={v.provider || "youtube"} onChange={(e) => { const arr = [...form.videos]; arr[i].provider = e.target.value; setForm(p=>({...p, videos:arr})) }}>
                        <option value="youtube" className="text-black">YouTube</option>
                        <option value="vimeo" className="text-black">Vimeo</option>
                        <option value="file" className="text-black">File</option>
                      </Select>
                      <Input value={v.url || ""} onChange={(e) => { const arr = [...form.videos]; arr[i].url = e.target.value; setForm(p=>({...p, videos:arr})) }} placeholder="Embed URL or Link" />
                      <button onClick={() => removeVideo(i)} className="h-full rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm text-white/60">
                      <input type="checkbox" checked={!!v.freePreview} onChange={(e) => { const arr = [...form.videos]; arr[i].freePreview = e.target.checked; setForm(p=>({...p, videos:arr})) }} />
                      Make this video free to preview
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}