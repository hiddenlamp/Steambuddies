// src/pages/courses/Courses.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  GraduationCap,
  Layers,
  X,
  PlayCircle,
  BookOpen,
  ChevronRight,
  Clock3
} from "lucide-react";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";

import CourseCard from "./CourseCard";
import StatCard from "./StatCard";
import { CATEGORIES, GRADE_GROUPS, SORTS, levelRank } from "./courses.data";

const cn = (...s) => s.filter(Boolean).join(" ");

/* ---------------- helpers ---------------- */
const toStr = (v) => (v === undefined || v === null ? "" : String(v)).trim();

function pickLocalized(v, lang = "en") {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    return toStr(v?.[lang]) || toStr(v?.en) || toStr(v?.hi) || "";
  }
  return toStr(v);
}

function normalizeCourseFromAssignment(a, lang) {
  const id = String(a?.courseId || a?.id || a?._id || "");
  if (!id) return null;

  const titleObj = a?.title;
  const descText = a?.sub;

  return {
    id,
    _id: id,
    _raw: a,
    title: typeof titleObj === "object" ? titleObj : { en: toStr(titleObj), hi: toStr(titleObj) },
    description: { en: toStr(descText), hi: toStr(descText) },
    badge: { en: "", hi: "" },
    category: toStr(a?.categoryLabel || "robotics").toLowerCase(),
    level: toStr(a?.level || "Beginner"),
    duration: a?.duration || { en: "", hi: "" },
    gradeGroup: a?.gradeGroup || "g78",
    progressPct: Number(a?.progressPct || 0),
    completedLessons: Number(a?.completedLessons || 0),
    totalLessons: Number(a?.totalLessons || 0),
    emoji: a?.emoji || "📚",
    status: a?.status || "active",
    topics: [],
    videos: [],
    skills: [],
    projects: [],
  };
}

export default function Courses() {
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);
  const lang = language || "en";

  const [token, setToken] = useState(() => (localStorage.getItem("accessToken") || "").trim());

  const [activeCategory, setActiveCategory] = useState(CATEGORIES?.[0]?.id || "robotics");
  const [activeGrades, setActiveGrades] = useState(new Set(GRADE_GROUPS.map((g) => g.id)));
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openCourse, setOpenCourse] = useState(null);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [netErr, setNetErr] = useState("");

  // Sync token from localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "accessToken") setToken((e.newValue || "").trim());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const sync = () => setToken((localStorage.getItem("accessToken") || "").trim());
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  // Fetch assigned courses
  const fetchAssignedCourses = async () => {
    const t = String(token || "").trim().replace(/^"+|"+$/g, "");
    if (!t) {
      setCourses([]);
      setNetErr("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    try {
      setNetErr("");
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/student/my-active-courses", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${t}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to fetch (${res.status})`);

      const raw = Array.isArray(data?.items) ? data.items : [];
      const list = raw.map((a) => normalizeCourseFromAssignment(a, lang)).filter(Boolean);

      const fixed = list.map((c) => {
        const valid = CATEGORIES.some((x) => x.id === c.category);
        return valid ? c : { ...c, category: CATEGORIES?.[0]?.id || "robotics" };
      });

      setCourses(fixed);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setNetErr(e?.message || "Network error while loading assigned courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    fetchAssignedCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lang]);

  const activeCatObj = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0],
    [activeCategory]
  );

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = courses
      .filter((c) => c.category === activeCategory)
      .filter((c) => activeGrades.has(c.gradeGroup))
      .filter((c) => {
        if (!q) return true;
        const title = pickLocalized(c?.title, lang) || "";
        const desc = pickLocalized(c?.description, lang) || "";
        const duration = pickLocalized(c?.duration, lang) || "";
        const blob = [title, desc, duration, c.level].join(" ").toLowerCase();
        return blob.includes(q);
      });

    if (sortBy === "title") {
      list = [...list].sort((a, b) => {
        const at = pickLocalized(a?.title, lang);
        const bt = pickLocalized(b?.title, lang);
        return at.localeCompare(bt);
      });
    }

    if (sortBy === "level") list = [...list].sort((a, b) => levelRank(a.level) - levelRank(b.level));

    return list;
  }, [courses, activeCategory, activeGrades, query, sortBy, lang]);

  const selectedGradesLabel = useMemo(() => {
    if (activeGrades.size === GRADE_GROUPS.length) return lang === "hi" ? "सभी कक्षाएँ" : "All Classes";
    const labels = GRADE_GROUPS.filter((g) => activeGrades.has(g.id)).map(
      (g) => g.label?.[lang] ?? g.label?.en ?? g.id
    );
    return labels.length ? labels.join(", ") : lang === "hi" ? "कोई क्लास चुनी नहीं" : "No class selected";
  }, [activeGrades, lang]);

  const toggleGrade = (id) => {
    setActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAllGrades = () => setActiveGrades(new Set());
  const selectAllGrades = () => setActiveGrades(new Set(GRADE_GROUPS.map((g) => g.id)));

  const gradeLabelById = (id) => {
    const g = GRADE_GROUPS.find((x) => x.id === id);
    return g ? g.label?.[lang] ?? g.label?.en ?? id : id;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#030008] text-slate-900 dark:text-slate-50 transition-colors duration-500 pb-24 md:pb-8 md:pl-28 md:pr-8">
      
      {/* ================= BACKGROUND FLOATING ORBS & GRID ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-mesh opacity-80" />
        
        {/* Floating gradient circles */}
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 40, -40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/8 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 40, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[-8%] w-[45vw] h-[45vw] rounded-full bg-cyan-400/12 dark:bg-cyan-500/8 blur-[140px]"
        />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-0">
        
        {/* ================= HEADER OVERVIEW BANNER ================= */}
        <section className="relative overflow-hidden rounded-[36px] p-6 md:p-8 border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 bg-white/70 dark:bg-[#07050f]/80 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-grid-mesh opacity-[0.05]" />
          <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />
          
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center space-y-4">
            <div className="
              inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black
              bg-slate-100 border-slate-200 text-slate-700
              dark:bg-white/10 dark:border-white/10 dark:text-cyan-300
            ">
              <Sparkles size={14} className="text-cyan-500 animate-pulse" />
              <span>Assigned Courses for your School</span>
            </div>

            <h1 className="text-balance text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              Your Class{" "}
              <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", activeCatObj.accent)}>
                Syllabus
              </span>
            </h1>

            <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {lang === "hi"
                ? "यहाँ सिर्फ वही courses दिखेंगे जो शिक्षक ने आपके School + Class के लिए assign किए हैं।"
                : "Only the courses assigned by your educator for your School + Class are shown here."}
            </p>

            {netErr && (
              <div className="mt-4 w-full rounded-2xl border p-4 text-left text-xs bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300 flex items-center justify-between gap-4">
                <span>{netErr}</span>
                <button
                  onClick={fetchAssignedCourses}
                  className="px-3.5 py-1.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ================= SEARCH & SEARCH CONTROLS ================= */}
            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row max-w-2xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={lang === "hi" ? "असाइन किए गए कोर्स सर्च करें…" : "Search assigned courses…"}
                  className="
                    w-full rounded-2xl border px-11 py-3 text-xs outline-none transition duration-300
                    bg-slate-50 border-slate-200 focus:border-slate-300 text-slate-800
                    dark:bg-slate-900/60 dark:border-white/5 dark:focus:border-white/10 dark:text-white dark:placeholder:text-white/40
                  "
                />
                {query?.length > 0 && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="
                    rounded-2xl border px-4 py-3 text-xs outline-none transition duration-300 font-bold
                    bg-slate-50 border-slate-200 text-slate-700
                    dark:bg-slate-900/60 dark:border-white/5 dark:text-white
                  "
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                      {lang === "hi" ? `Sort: ${s.label.hi}` : `Sort: ${s.label.en}`}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className="
                    inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition duration-300
                    bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100
                    dark:bg-slate-900/60 dark:border-white/5 dark:text-white dark:hover:bg-white/10
                  "
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
              </div>
            </div>

            {/* Glass filters expanded panel */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full overflow-hidden rounded-2xl border bg-slate-50/50 border-slate-200 dark:bg-slate-950/40 dark:border-white/5 mt-4"
                >
                  <div className="p-4 space-y-4 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 dark:border-white/5 pb-2">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <GraduationCap size={16} />
                        <span>Class Groups:</span>
                        <span className="text-cyan-600 dark:text-cyan-300">{selectedGradesLabel}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllGrades}
                          className="px-2.5 py-1 text-[10px] font-black rounded-lg border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        >
                          Select all
                        </button>
                        <button
                          onClick={clearAllGrades}
                          className="px-2.5 py-1 text-[10px] font-black rounded-lg border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {GRADE_GROUPS.map((g) => {
                        const active = activeGrades.has(g.id);
                        return (
                          <button
                            key={g.id}
                            onClick={() => toggleGrade(g.id)}
                            className={cn(
                              "rounded-2xl border p-3 text-left transition duration-300",
                              active
                                ? "bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-300"
                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10"
                            )}
                          >
                            <div className="text-xs font-black">{g.label?.[lang] ?? g.label?.en}</div>
                            <div className="mt-0.5 text-[9px] opacity-75">
                              {lang === "hi" ? "इस ग्रुप का सिलेबस" : "Syllabus for this class"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ================= CATEGORY TABS ================= */}
        <section className="mt-8 space-y-4">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-6 rounded-full bg-cyan-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white px-2">
              Explore by Subject
            </h2>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const active = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border px-4.5 py-2.5 text-xs font-black transition duration-300 focus:outline-none",
                    active
                      ? "bg-gradient-to-tr from-slate-900 to-slate-800 border-slate-950 text-white dark:from-white dark:to-slate-100 dark:border-white dark:text-slate-950 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-slate-900/60 dark:border-white/5 dark:text-slate-400 dark:hover:border-white/12"
                  )}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="whitespace-nowrap">{cat.name?.[lang] ?? cat.name?.en}</span>
                  {active && <span className={cn("ml-1.5 rounded-full px-2 py-0.5 text-[9px] ring-1", cat.chip)}>Active</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= STATS WIDGET ROW ================= */}
        <section className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            theme={theme}
            title="Courses Found"
            value={loading ? "…" : String(filteredCourses.length)}
            subtitle="Assigned syllabus"
            icon={<Layers size={16} />}
            gradient={activeCatObj.accent}
          />
          <StatCard
            theme={theme}
            title="Delivery Mode"
            value="Interactive"
            subtitle="3D Simulators & Labs"
            icon={<Sparkles size={16} />}
            gradient="from-violet-500 via-fuchsia-400 to-pink-400"
          />
          <StatCard
            theme={theme}
            title="Access Model"
            value="Personalized"
            subtitle="Custom school content"
            icon={<GraduationCap size={16} />}
            gradient="from-emerald-500 via-teal-400 to-cyan-300"
          />
        </section>

        {/* ================= COURSES CARD GRID ================= */}
        <section className="mt-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-100 dark:bg-white/5 h-64 rounded-3xl border border-slate-200 dark:border-white/5" />
                ))}
              </motion.div>
            ) : filteredCourses.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border p-12 text-center bg-white border-slate-200 dark:bg-slate-950/60 dark:border-white/5 space-y-3"
              >
                <div className="text-4xl">📚</div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">No Assigned Courses Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === "hi" 
                    ? "इस श्रेणी के तहत आपके स्कूल के लिए कोई कोर्स उपलब्ध नहीं है।" 
                    : "No syllabus courses are currently assigned for your grade in this category."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    cat={activeCatObj}
                    theme={theme}
                    lang={lang}
                    gradeLabel={gradeLabelById(course.gradeGroup)}
                    onOpen={setOpenCourse}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {openCourse && (
          <CourseDetailsModal theme={theme} lang={lang} cat={activeCatObj} course={openCourse} onClose={() => setOpenCourse(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================== DETAILED VIEW MODAL ================== */
function CourseDetailsModal({ theme, lang, course, onClose, cat }) {
  const title = pickLocalized(course?.title, lang) || "Course";
  const desc = pickLocalized(course?.description, lang) || "";
  const duration = pickLocalized(course?.duration, lang) || "";

  const topics = (course.topics || []).map((t) => ({
    title: pickLocalized(t?.titleObj || t?.title, lang) || "Section",
    lessons: Array.isArray(t?.lessonsObj) ? t.lessonsObj.map((l) => pickLocalized(l?.title, lang)).filter(Boolean) : t?.lessons || [],
  }));

  const videos = course.videos || [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ y: 30, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="
          relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl
          bg-white border-slate-200 text-slate-800
          dark:bg-slate-950/90 dark:border-white/10 dark:text-slate-100
        "
      >
        {/* Header accent strip */}
        <div className={cn("h-3 bg-gradient-to-r", cat.accent)} />

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scroll">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px]">
                  {course.level}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock3 size={12} />
                  {duration}
                </span>
              </div>
              <h2 className="mt-2.5 text-xl font-black text-slate-800 dark:text-white leading-tight">
                {title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {desc}
          </p>

          {/* Topics List */}
          {topics.length > 0 && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                <BookOpen size={16} className="text-indigo-500" />
                <span>Syllabus Breakdown</span>
              </div>

              <div className="grid gap-3">
                {topics.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-white/5 dark:bg-white/5"
                  >
                    <div className="text-xs font-black text-slate-800 dark:text-white">{t.title}</div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {(t.lessons || []).map((l, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Lectures */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                <PlayCircle size={16} className="text-rose-500" />
                <span>Video Tutorials</span>
              </div>

              <div className="grid gap-2.5">
                {videos.map((v, idx) => {
                  const vt = pickLocalized(v?.title, lang) || "Video Tutorial";
                  return (
                    <a
                      key={idx}
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="
                        flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300
                        bg-white border-slate-200 hover:border-rose-400/50 text-slate-800
                        dark:bg-white/5 dark:border-white/5 dark:hover:border-white/10 dark:text-white
                      "
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{vt}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400 truncate">{v.url}</div>
                      </div>
                      <PlayCircle size={20} className="text-rose-500 shrink-0 opacity-80" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}
