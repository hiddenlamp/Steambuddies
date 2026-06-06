// src/pages/educator/courses/CourseStudio.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, Send, RefreshCw, Pencil, Search, CheckCircle2, X } from "lucide-react";

import {
  listMyCoursesApi,
  createCourseApi,
  updateCourseApi,
  deleteCourseApi,
  patchCourseApi,
  getMyCourseApi,
} from "../../api/courses.api";

import { CATEGORIES, GRADE_GROUPS } from "../../courses/courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");
const emptyLS = () => ({ en: "", hi: "" });

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

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-white/60 font-extrabold tracking-[0.18em] uppercase">{label}</p>
      {children}
    </div>
  );
}

function normalizePayload(form, status) {
  // ✅ normalize: remove empty strings from arrays & remove empty lessons
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

  // ✅ auto lectures count (optional)
  payload.meta = payload.meta || {};
  payload.meta.lectures = payload.meta.lectures || payload.videos.length || 0;

  return payload;
}

export default function CourseStudio() {
  const categories = useMemo(() => CATEGORIES, []);
  const grades = useMemo(() => GRADE_GROUPS, []);

  // Tabs: builder | videos | history | posts | mocktests
  const [tab, setTab] = useState("builder");

  // course list (history)
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [q, setQ] = useState("");

  // editor state
  const [form, setForm] = useState(() => emptyCourse());
  const [activeId, setActiveId] = useState(null); // if set -> edit mode
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null); // {type:'success'|'error', msg:string}
  const [err, setErr] = useState("");

  const setLS = (key, lang, val) =>
    setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  // ---------- list ----------
  const fetchMine = async () => {
    try {
      setErr("");
      setListLoading(true);
      const res = await listMyCoursesApi();
      const data = res?.data?.data ?? res?.data?.courses ?? res?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load courses");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((c) => {
      const title = (c?.title?.en ?? c?.title ?? "").toLowerCase();
      const id = (c?._id ?? c?.id ?? "").toLowerCase();
      return title.includes(t) || id.includes(t);
    });
  }, [list, q]);

  // ---------- builder actions ----------
  const resetToNew = () => {
    setActiveId(null);
    setForm(emptyCourse());
    setToast({ type: "success", msg: "Ready to create a new course ✅" });
    setErr("");
    setTab("builder");
  };

  const loadForEdit = async (id) => {
    try {
      setErr("");
      setToast(null);
      setSaving(true);
      const res = await getMyCourseApi(id);
      const c = res?.data?.data ?? res?.data?.course ?? res?.data;

      setActiveId(id);
      setForm({
        ...emptyCourse(),
        ...c,
        title: c?.title || emptyLS(),
        duration: c?.duration || emptyLS(),
        description: c?.description || emptyLS(),
        includes: Array.isArray(c?.includes) ? c.includes : (c?.includes ? [c.includes] : [emptyLS()]),
        skills: Array.isArray(c?.skills) ? c.skills : [],
        projects: Array.isArray(c?.projects) ? c.projects : [],
        curriculum: Array.isArray(c?.curriculum) ? c.curriculum : [{ title: emptyLS(), lessons: [{ title: emptyLS() }] }],
        videos: Array.isArray(c?.videos) ? c.videos : [{ title: emptyLS(), provider: "youtube", freePreview: true, url: "" }],
      });

      setToast({ type: "success", msg: "Course loaded for edit ✅" });
      setTab("builder");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load course");
      setToast({ type: "error", msg: "Failed to load course" });
    } finally {
      setSaving(false);
    }
  };

  const saveCourse = async (status) => {
    setErr("");
    setToast(null);

    // basic validate
    const tEn = (form?.title?.en || "").trim();
    const tHi = (form?.title?.hi || "").trim();
    if (!tEn && !tHi) {
      const msg = "Title is required (EN or HI).";
      setErr(msg);
      setToast({ type: "error", msg });
      setTab("builder");
      return;
    }

    try {
      setSaving(true);

      const payload = normalizePayload(form, status);

      let res;
      if (activeId) {
        res = await updateCourseApi(activeId, payload);
      } else {
        res = await createCourseApi(payload);
      }

      const ok = res?.data?.ok ?? true; // many backends don't send ok
      if (ok) {
        setToast({
          type: "success",
          msg: activeId
            ? (status === "published" ? "✅ Course updated & published." : "✅ Course updated (Draft).")
            : (status === "published" ? "✅ Course created & published." : "✅ Course created (Draft)."),
        });
        await fetchMine();

        // after create -> set activeId for further edits (if backend returns id)
        const createdId = res?.data?.id || res?.data?.course?._id || res?.data?.course?.id;
        if (!activeId && createdId) setActiveId(createdId);
      } else {
        setErr("Failed to save course.");
        setToast({ type: "error", msg: "Failed to save course." });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error";
      setErr(msg);
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ✅ PATCH only videos (day-by-day)
  const patchVideosOnly = async () => {
    if (!activeId) {
      setToast({ type: "error", msg: "First save/create course, then patch videos." });
      setTab("videos");
      return;
    }
    try {
      setSaving(true);
      const videos = (form.videos || []).filter((v) => (v?.url || "").trim());
      await patchCourseApi(activeId, { videos });
      setToast({ type: "success", msg: "✅ Videos updated (PATCH)." });
      await fetchMine();
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.message || e?.message || "Patch failed" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      await deleteCourseApi(id);
      setToast({ type: "success", msg: "✅ Course deleted." });
      setList((prev) => prev.filter((x) => (x._id || x.id) !== id));
      if (activeId === id) resetToNew();
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.message || e?.message || "Delete failed" });
    }
  };

  // ---------- form helpers ----------
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
      curriculum[secIdx] = {
        ...sec,
        lessons: [...(sec.lessons || []), { title: emptyLS() }],
      };
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

  // ---------- UI ----------
  const headerTitle = activeId ? "Course Studio (Edit Mode)" : "Course Studio (Create Mode)";
  const subtitle = activeId
    ? `Editing: ${form?.title?.en || form?.title?.hi || "Untitled"}`
    : "Create a new course and publish anytime.";

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "rounded-2xl px-4 py-2 text-[13px] font-black transition border",
        tab === id
          ? "bg-white text-slate-900 border-white/20"
          : "bg-white/6 text-white/75 border-white/10 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* TOP BAR */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-extrabold tracking-[0.22em] text-white/60 uppercase">
            Educator Panel
          </p>
          <h2 className="mt-1 text-[18px] font-black">{headerTitle}</h2>
          <p className="text-[12px] text-white/65 font-semibold">{subtitle}</p>
          {activeId ? <p className="text-[11px] text-white/45 font-semibold mt-1">ID: {activeId}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={() => saveCourse("draft")}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition",
              "flex items-center gap-2 disabled:opacity-60"
            )}
          >
            <Save className="h-4 w-4" /> {activeId ? "Update Draft" : "Save Draft"}
          </button>

          <button
            disabled={saving}
            onClick={() => saveCourse("published")}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-emerald-400/12 hover:bg-emerald-400/18 border border-emerald-300/25 hover:border-emerald-300/35 transition",
              "flex items-center gap-2 disabled:opacity-60"
            )}
          >
            <Send className="h-4 w-4" /> Publish
          </button>

          <button
            disabled={saving}
            onClick={resetToNew}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-black/20 hover:bg-black/30 border border-white/10 transition",
              "flex items-center gap-2 disabled:opacity-60"
            )}
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast?.msg ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "rounded-2xl border p-3 text-[12px] font-semibold flex items-start justify-between gap-3",
              toast.type === "success"
                ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-100"
                : "border-red-400/25 bg-red-500/10 text-red-200"
            )}
          >
            <div className="flex items-start gap-2">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <X className="h-4 w-4 mt-0.5" />
              )}
              <div>{toast.msg}</div>
            </div>

            <button
              onClick={() => setToast(null)}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {err ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] text-red-200 font-semibold">
          {err}
        </div>
      ) : null}

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        <TabBtn id="builder" label="Course Builder" />
        <TabBtn id="videos" label="Videos (Day-by-Day)" />
        <TabBtn id="history" label="My Courses (History)" />
        <TabBtn id="posts" label="Daily Posts" />
        <TabBtn id="mocktests" label="Mock Tests" />
      </div>

      {/* CONTENT */}
      {tab === "builder" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.en}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Grade Group">
                  <select
                    value={form.gradeGroup}
                    onChange={(e) => setForm((s) => ({ ...s, gradeGroup: e.target.value }))}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label.en}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Title (EN)">
                  <input
                    value={form.title.en}
                    onChange={(e) => setLS("title", "en", e.target.value)}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
                <Field label="Title (HI)">
                  <input
                    value={form.title.hi}
                    onChange={(e) => setLS("title", "hi", e.target.value)}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Level">
                  <input
                    value={form.level}
                    onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>

                <Field label="Lectures (count)">
                  <input
                    type="number"
                    value={form.meta.lectures}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        meta: { ...s.meta, lectures: Number(e.target.value || 0) },
                      }))
                    }
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Duration (EN)">
                  <input
                    value={form.duration.en}
                    onChange={(e) => setLS("duration", "en", e.target.value)}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
                <Field label="Duration (HI)">
                  <input
                    value={form.duration.hi}
                    onChange={(e) => setLS("duration", "hi", e.target.value)}
                    className="w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Description (EN)">
                  <textarea
                    value={form.description.en}
                    onChange={(e) => setLS("description", "en", e.target.value)}
                    className="w-full min-h-[90px] rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
                <Field label="Description (HI)">
                  <textarea
                    value={form.description.hi}
                    onChange={(e) => setLS("description", "hi", e.target.value)}
                    className="w-full min-h-[90px] rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                  />
                </Field>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black">Skills</p>
                <button
                  onClick={addSkill}
                  className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {(form.skills || []).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={s}
                      onChange={(e) =>
                        setForm((prev) => {
                          const skills = [...(prev.skills || [])];
                          skills[i] = e.target.value;
                          return { ...prev, skills };
                        })
                      }
                      className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                      placeholder="e.g. Alignment, Export STL"
                    />
                    <button
                      onClick={() => removeAt("skills", i)}
                      className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-200" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT (Includes/Projects/Curriculum same as your code) */}
          <div className="space-y-4">
            {/* Includes */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black">Includes</p>
                <button
                  onClick={addInclude}
                  className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {(form.includes || []).map((inc, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={inc.en}
                      onChange={(e) =>
                        setForm((prev) => {
                          const includes = [...(prev.includes || [])];
                          includes[i] = { ...(includes[i] || emptyLS()), en: e.target.value };
                          return { ...prev, includes };
                        })
                      }
                      className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                      placeholder="Include (EN)"
                    />
                    <div className="flex gap-2">
                      <input
                        value={inc.hi}
                        onChange={(e) =>
                          setForm((prev) => {
                            const includes = [...(prev.includes || [])];
                            includes[i] = { ...(includes[i] || emptyLS()), hi: e.target.value };
                            return { ...prev, includes };
                          })
                        }
                        className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                        placeholder="Include (HI)"
                      />
                      <button
                        onClick={() => removeAt("includes", i)}
                        className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                      >
                        <Trash2 className="h-4 w-4 text-red-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black">Projects</p>
                <button
                  onClick={addProject}
                  className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {(form.projects || []).map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={p}
                      onChange={(e) =>
                        setForm((prev) => {
                          const projects = [...(prev.projects || [])];
                          projects[i] = e.target.value;
                          return { ...prev, projects };
                        })
                      }
                      className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                      placeholder="e.g. Line Follower"
                    />
                    <button
                      onClick={() => removeAt("projects", i)}
                      className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-200" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum (same as your UI) */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black">Curriculum</p>
                <button
                  onClick={addSection}
                  className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Section
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {(form.curriculum || []).map((sec, sidx) => (
                  <div key={sidx} className="rounded-3xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid gap-2 sm:grid-cols-2">
                        <input
                          value={sec?.title?.en || ""}
                          onChange={(e) =>
                            setForm((prev) => {
                              const curriculum = [...(prev.curriculum || [])];
                              const curSec = curriculum[sidx] || { title: emptyLS(), lessons: [] };
                              curriculum[sidx] = { ...curSec, title: { ...(curSec.title || emptyLS()), en: e.target.value } };
                              return { ...prev, curriculum };
                            })
                          }
                          className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                          placeholder="Section title (EN)"
                        />
                        <input
                          value={sec?.title?.hi || ""}
                          onChange={(e) =>
                            setForm((prev) => {
                              const curriculum = [...(prev.curriculum || [])];
                              const curSec = curriculum[sidx] || { title: emptyLS(), lessons: [] };
                              curriculum[sidx] = { ...curSec, title: { ...(curSec.title || emptyLS()), hi: e.target.value } };
                              return { ...prev, curriculum };
                            })
                          }
                          className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                          placeholder="Section title (HI)"
                        />
                      </div>

                      <button
                        onClick={() => removeSection(sidx)}
                        className="rounded-2xl px-3 py-2 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                      >
                        <Trash2 className="h-4 w-4 text-red-200" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-white/60 font-extrabold tracking-[0.18em] uppercase">
                          Lessons
                        </p>
                        <button
                          onClick={() => addLesson(sidx)}
                          className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Lesson
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        {(sec.lessons || []).map((l, lidx) => (
                          <div key={lidx} className="grid gap-2 sm:grid-cols-2">
                            <input
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
                              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                              placeholder="Lesson (EN)"
                            />
                            <div className="flex gap-2">
                              <input
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
                                className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                                placeholder="Lesson (HI)"
                              />
                              <button
                                onClick={() => removeLesson(sidx, lidx)}
                                className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                              >
                                <Trash2 className="h-4 w-4 text-red-200" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIDEOS TAB (day-by-day) */}
      {tab === "videos" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-black">Videos / Lectures</div>
                <div className="text-[12px] text-white/60 font-semibold">
                  Day-by-day videos add/update/remove → <b>PATCH</b> button
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addVideo}
                  className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Video
                </button>

                <button
                  disabled={saving}
                  onClick={patchVideosOnly}
                  className="rounded-2xl px-4 py-2 bg-sky-400/15 border border-sky-300/25 hover:bg-sky-400/20 transition text-[12px] font-black disabled:opacity-60"
                >
                  Save Videos (PATCH)
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {(form.videos || []).map((v, i) => (
                <div key={i} className="rounded-3xl border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={v?.title?.en || ""}
                      onChange={(e) =>
                        setForm((prev) => {
                          const videos = [...(prev.videos || [])];
                          videos[i] = { ...videos[i], title: { ...(videos[i].title || emptyLS()), en: e.target.value } };
                          return { ...prev, videos };
                        })
                      }
                      className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                      placeholder="Video title (EN)"
                    />
                    <input
                      value={v?.title?.hi || ""}
                      onChange={(e) =>
                        setForm((prev) => {
                          const videos = [...(prev.videos || [])];
                          videos[i] = { ...videos[i], title: { ...(videos[i].title || emptyLS()), hi: e.target.value } };
                          return { ...prev, videos };
                        })
                      }
                      className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                      placeholder="Video title (HI)"
                    />
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[160px_1fr]">
                    <select
                      value={v.provider || "youtube"}
                      onChange={(e) =>
                        setForm((prev) => {
                          const videos = [...(prev.videos || [])];
                          videos[i] = { ...videos[i], provider: e.target.value };
                          return { ...prev, videos };
                        })
                      }
                      className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="file">File</option>
                      <option value="other">Other</option>
                    </select>

                    <div className="flex gap-2">
                      <input
                        value={v.url || ""}
                        onChange={(e) =>
                          setForm((prev) => {
                            const videos = [...(prev.videos || [])];
                            videos[i] = { ...videos[i], url: e.target.value };
                            return { ...prev, videos };
                          })
                        }
                        className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                        placeholder="Video URL (embed/link)"
                      />
                      <button
                        onClick={() => removeAt("videos", i)}
                        className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                      >
                        <Trash2 className="h-4 w-4 text-red-200" />
                      </button>
                    </div>
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-white/70">
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

            {!activeId ? (
              <div className="mt-3 text-xs text-amber-200/90 font-semibold">
                ⚠️ First create/save the course (Draft/Publish) then PATCH videos.
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] text-white/70 font-semibold">
              Your created courses list (edit/delete anytime)
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchMine}
                className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or id…"
              className="w-full rounded-2xl bg-black/25 border border-white/10 px-10 py-3 text-sm font-semibold text-white outline-none"
            />
          </div>

          {listLoading ? (
            <div className="text-white/70 font-semibold">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/70 font-semibold">
              No courses found.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const id = c._id || c.id;
                return (
                  <div key={id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-black truncate">
                          {c?.title?.en ?? c?.title?.hi ?? "Untitled"}
                        </div>
                        <div className="text-xs text-white/60 font-semibold mt-1">
                          {c.category} • {c.gradeGroup} •{" "}
                          <span className="uppercase">{c.status || "draft"}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadForEdit(id)}
                          className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-white/80" />
                        </button>

                        <button
                          onClick={() => onDelete(id)}
                          className="rounded-2xl px-3 py-2 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-200" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-white/70 line-clamp-3">
                      {c?.description?.en ?? c?.description?.hi ?? ""}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-white/55 font-semibold">
                      <div>Videos: {(c?.videos || []).length}</div>
                      <div>{c?.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "-"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* DAILY POSTS (placeholder) */}
      {tab === "posts" && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white/80">
          <div className="text-lg font-black">Daily Posts</div>
          <div className="mt-2 text-sm text-white/60 font-semibold">
            Next step: Daily post create/update/delete + history. (Structure ready)
          </div>
        </div>
      )}

      {/* MOCK TESTS (placeholder) */}
      {tab === "mocktests" && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white/80">
          <div className="text-lg font-black">Mock Tests</div>
          <div className="mt-2 text-sm text-white/60 font-semibold">
            Next step: Mock test create/update/delete + history + questions builder. (Structure ready)
          </div>
        </div>
      )}
    </div>
  );
}
