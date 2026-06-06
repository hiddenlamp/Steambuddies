// src/pages/educator/courses/CourseEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Send, ArrowLeft, Plus, Trash2 } from "lucide-react";

import { getMyCourseApi, updateCourseApi, patchCourseApi } from "../../api/courses.api";
import { CATEGORIES, GRADE_GROUPS } from "../../courses/courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");
const emptyLS = () => ({ en: "", hi: "" });

export default function CourseEdit() {
  const nav = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState(null);

  const categories = useMemo(() => CATEGORIES, []);
  const grades = useMemo(() => GRADE_GROUPS, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await getMyCourseApi(id);
        const c = res?.data?.data ?? res?.data?.course ?? res?.data;
        if (!alive) return;

        // Minimal normalize to avoid undefined
        setForm({
          ...c,
          title: c?.title || emptyLS(),
          duration: c?.duration || emptyLS(),
          description: c?.description || emptyLS(),
          includes: Array.isArray(c?.includes) ? c.includes : [emptyLS()],
          skills: Array.isArray(c?.skills) ? c.skills : [],
          projects: Array.isArray(c?.projects) ? c.projects : [],
          curriculum: Array.isArray(c?.curriculum) ? c.curriculum : [{ title: emptyLS(), lessons: [{ title: emptyLS() }] }],
          videos: Array.isArray(c?.videos) ? c.videos : [{ title: emptyLS(), provider: "youtube", freePreview: true, url: "" }],
        });
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || e?.message || "Failed to load course");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const setLS = (key, lang, val) => setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  const removeAt = (arrKey, idx) => setForm((s) => ({ ...s, [arrKey]: (s[arrKey] || []).filter((_, i) => i !== idx) }));

  const addVideo = () => setForm((s) => ({
    ...s,
    videos: [...(s.videos || []), { title: emptyLS(), provider: "youtube", freePreview: false, url: "" }],
  }));

  const saveFull = async (status) => {
    setOk("");
    setErr("");
    try {
      setSaving(true);

      const payload = {
        ...form,
        status,
        skills: (form.skills || []).map((x) => String(x || "").trim()).filter(Boolean),
        projects: (form.projects || []).map((x) => String(x || "").trim()).filter(Boolean),
        includes: (form.includes || []).filter((x) => (x?.en || "").trim() || (x?.hi || "").trim()),
        curriculum: (form.curriculum || []).map((sec) => ({
          ...sec,
          lessons: (sec.lessons || []).filter((l) => (l?.title?.en || "").trim() || (l?.title?.hi || "").trim()),
        })),
        videos: (form.videos || []).filter((v) => (v?.url || "").trim()),
      };

      await updateCourseApi(id, payload);
      setOk(status === "published" ? "✅ Course published" : "✅ Draft updated");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ PATCH only videos (day-by-day update)
  const saveVideosOnly = async () => {
    setOk("");
    setErr("");
    try {
      setSaving(true);
      const videos = (form.videos || []).filter((v) => (v?.url || "").trim());
      await patchCourseApi(id, { videos });
      setOk("✅ Videos updated (PATCH)");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Patch failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/70 font-semibold">Loading…</div>;
  if (!form) return <div className="text-red-200 font-semibold">{err || "Course not found"}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav("/educator/courses")}
            className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition"
          >
            <ArrowLeft className="h-4 w-4 text-white/80" />
          </button>
          <div>
            <div className="text-[12px] tracking-[0.18em] uppercase text-white/60 font-extrabold">
              Edit Course
            </div>
            <div className="text-xl font-black">{form?.title?.en || "Untitled"}</div>
            <div className="text-xs text-white/60 font-semibold">ID: {id}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={() => saveFull("draft")}
            className="rounded-2xl px-4 py-2.5 bg-white/8 border border-white/10 hover:bg-white/12 transition font-black text-sm flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>

          <button
            disabled={saving}
            onClick={() => saveFull("published")}
            className="rounded-2xl px-4 py-2.5 bg-emerald-400/15 border border-emerald-300/25 hover:bg-emerald-400/20 transition font-black text-sm flex items-center gap-2 disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Publish
          </button>

          <button
            disabled={saving}
            onClick={saveVideosOnly}
            className="rounded-2xl px-4 py-2.5 bg-sky-400/15 border border-sky-300/25 hover:bg-sky-400/20 transition font-black text-sm disabled:opacity-60"
          >
            PATCH Videos
          </button>
        </div>
      </div>

      {err ? <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] text-red-200 font-semibold">{err}</div> : null}
      {ok ? <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3 text-[12px] text-emerald-100 font-semibold">{ok}</div> : null}

      {/* BASIC FIELDS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-[11px] text-white/60 font-extrabold tracking-[0.18em] uppercase">Category</div>
              <select
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[11px] text-white/60 font-extrabold tracking-[0.18em] uppercase">Grade Group</div>
              <select
                value={form.gradeGroup}
                onChange={(e) => setForm((s) => ({ ...s, gradeGroup: e.target.value }))}
                className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.label.en}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title?.en || ""}
              onChange={(e) => setLS("title", "en", e.target.value)}
              placeholder="Title (EN)"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
            <input
              value={form.title?.hi || ""}
              onChange={(e) => setLS("title", "hi", e.target.value)}
              placeholder="Title (HI)"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.level || ""}
              onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}
              placeholder="Level"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
            <input
              type="number"
              value={form?.meta?.lectures ?? 0}
              onChange={(e) => setForm((s) => ({ ...s, meta: { ...(s.meta || {}), lectures: Number(e.target.value || 0) } }))}
              placeholder="Lectures"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.duration?.en || ""}
              onChange={(e) => setLS("duration", "en", e.target.value)}
              placeholder="Duration (EN)"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
            <input
              value={form.duration?.hi || ""}
              onChange={(e) => setLS("duration", "hi", e.target.value)}
              placeholder="Duration (HI)"
              className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <textarea
              value={form.description?.en || ""}
              onChange={(e) => setLS("description", "en", e.target.value)}
              placeholder="Description (EN)"
              className="min-h-[90px] rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
            <textarea
              value={form.description?.hi || ""}
              onChange={(e) => setLS("description", "hi", e.target.value)}
              placeholder="Description (HI)"
              className="min-h-[90px] rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
            />
          </div>
        </div>

        {/* VIDEOS EDIT (DAY BY DAY) */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black">Videos (Add anytime)</div>
            <button
              onClick={addVideo}
              className="rounded-2xl px-3 py-2 bg-white/8 border border-white/10 hover:bg-white/12 transition text-[12px] font-black flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Video
            </button>
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
                        videos[i] = { ...videos[i], title: { ...(videos[i].title || {}), en: e.target.value } };
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
                        videos[i] = { ...videos[i], title: { ...(videos[i].title || {}), hi: e.target.value } };
                        return { ...prev, videos };
                      })
                    }
                    className="rounded-2xl bg-black/25 border border-white/10 px-3 py-2 text-[13px] font-semibold outline-none"
                    placeholder="Video title (HI)"
                  />
                </div>

                <div className="mt-2 flex gap-2">
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
                    placeholder="Video URL"
                  />

                  <button
                    onClick={() => removeAt("videos", i)}
                    className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                  >
                    <Trash2 className="h-4 w-4 text-red-200" />
                  </button>
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

          <div className="mt-3 text-xs text-white/55 font-semibold">
            Tip: Day-by-day sirf videos update karna ho to <b>PATCH Videos</b> button use karo.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
