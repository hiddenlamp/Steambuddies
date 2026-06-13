// src/pages/educator/NewCourse.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Send } from "lucide-react";
import { api } from "../../api/axios";
import { CATEGORIES, GRADE_GROUPS } from "./courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");

const emptyLS = () => ({ en: "", hi: "" });

const emptyCourse = () => ({
  category: "3d",
  gradeGroup: "c6",
  title: emptyLS(),
  level: "Beginner",
  description: emptyLS(),
  status: "draft",
});

const useEducatorTheme = () => ({
  pageBase: "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_25%),linear-gradient(180deg,#08111f_0%,#0b1325_45%,#120d20_100%)] text-white",
  glass: "border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.18)]",
  muted: "text-white/70",
  muted2: "text-white/55",
});

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/65">{label}</div>
      {children}
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

export default function NewCourse() {
  const nav = useNavigate();
  const { pageBase, glass, muted } = useEducatorTheme();

  const [form, setForm] = useState(() => emptyCourse());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const categories = useMemo(() => CATEGORIES, []);
  const grades = useMemo(() => GRADE_GROUPS, []);

  const setLS = (key, lang, val) =>
    setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  const validate = () => {
    const tEn = (form.title.en || "").trim();
    const tHi = (form.title.hi || "").trim();
    if (!tEn && !tHi) return "Title is required (EN or HI).";
    if (!form.category) return "Category is required.";
    if (!form.gradeGroup) return "Class is required.";
    return "";
  };

  const createCourse = async () => {
    setErr("");
    const vErr = validate();
    if (vErr) {
      setErr(vErr);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        status: "draft",
        meta: { lectures: 0, rating: 0, language: ["en", "hi"], certificate: true },
        skills: [],
        includes: [],
        projects: [],
        curriculum: [],
        videos: [],
      };

      const res = await api.post("/courses", payload);
      const createdId = res?.data?.id || res?.data?.course?._id || res?.data?.course?.id;

      if (createdId) {
        nav(`/educator/courses/${createdId}/edit`);
      } else {
        nav("/educator/courses");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to create course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("min-h-screen", pageBase)}>
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("overflow-hidden rounded-3xl border p-6 md:p-10", glass)}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => nav("/educator/courses")}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[22px] md:text-[28px] font-black tracking-tight">Create New Course</h2>
              <p className={cn("mt-1 text-[13px] font-semibold", muted)}>
                Start with basic info. You can add lectures and videos later in the Course Studio.
              </p>
            </div>
          </div>

          {err && (
            <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-[13px] text-red-200 font-semibold">
              {err}
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Course Title (English)">
                <Input
                  placeholder="e.g. Intro to 3D Design"
                  value={form.title.en}
                  onChange={(e) => setLS("title", "en", e.target.value)}
                />
              </Field>
              <Field label="Course Title (Hindi)">
                <Input
                  placeholder="e.g. 3D डिज़ाइन का परिचय"
                  value={form.title.hi}
                  onChange={(e) => setLS("title", "hi", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Category">
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
              <Field label="Class">
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
              <Field label="Level">
                <Select
                  value={form.level}
                  onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}
                >
                  <option value="Beginner" className="text-black">Beginner</option>
                  <option value="Intermediate" className="text-black">Intermediate</option>
                  <option value="Advanced" className="text-black">Advanced</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Short Description (English)">
                <Input
                  placeholder="A brief overview..."
                  value={form.description.en}
                  onChange={(e) => setLS("description", "en", e.target.value)}
                />
              </Field>
              <Field label="Short Description (Hindi)">
                <Input
                  placeholder="संक्षिप्त विवरण..."
                  value={form.description.hi}
                  onChange={(e) => setLS("description", "hi", e.target.value)}
                />
              </Field>
            </div>

            <div className="pt-6 flex justify-end border-t border-white/10">
              <button
                disabled={saving}
                onClick={createCourse}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-6 py-3 text-[14px] font-black text-white transition hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                <Send className="h-5 w-5" />
                {saving ? "Creating..." : "Create Course & Add Lectures"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}