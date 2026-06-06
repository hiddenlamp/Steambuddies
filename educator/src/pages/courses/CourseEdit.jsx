function normalizeForm(c) {
  return {
    category: c?.category ?? "robotics",
    gradeGroup: c?.gradeGroup ?? "g78",
    title: c?.title ?? emptyLS(),
    level: c?.level ?? "Beginner",
    duration: c?.duration ?? emptyLS(),
    meta: c?.meta ?? { lectures: 0, rating: 0, language: ["en", "hi"], certificate: true },
    skills: Array.isArray(c?.skills) ? c.skills : [],
    description: c?.description ?? emptyLS(),
    includes: Array.isArray(c?.includes) ? c.includes : c?.includes ? [c.includes] : [emptyLS()],
    projects: Array.isArray(c?.projects) ? c.projects : [],
    curriculum: Array.isArray(c?.curriculum) ? c.curriculum : [{ title: emptyLS(), lessons: [{ title: emptyLS() }] }],
    videos: Array.isArray(c?.videos) ? c.videos : [{ title: emptyLS(), provider: "youtube", freePreview: true, url: "" }],
    badge: c?.badge ?? emptyLS(),
    status: c?.status ?? "draft",
  };
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

  const cat = useMemo(() => getCat(form?.category), [form?.category]);
  const accent = cat?.accent || "from-sky-500 via-indigo-500 to-fuchsia-500";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setLS = (key, lang, val) => setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), [lang]: val } }));

  const addVideo = () =>
    setForm((s) => ({ ...s, videos: [...(s.videos || []), { title: emptyLS(), provider: "youtube", freePreview: false, url: "" }] }));
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

  const patchVideosOnly = async () => {
    if (!form) return;
    setErr("");
    setToast(null);

    try {
      setSaving(true);
      const videos = (form.videos || []).filter((v) => (v?.url || "").trim());
      await patchCourseApi(id, { videos });
      setToast({ type: "success", msg: "✅ Videos updated (PATCH)." });
      await fetchOne();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Patch failed";
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
      setToast({ type: "success", msg: "✅ Course deleted." });
      nav("/educator/courses");
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.message || e?.message || "Delete failed" });
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen", pageBase)}>
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
          <div className={cn("rounded-3xl border p-6 font-semibold", glass, muted)}>Loading…</div>
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
    { id: "basic", label: "Basics" },
    { id: "videos", label: "Videos (PATCH)" },
  ];

  return (
    <div className={cn("min-h-screen", pageBase)}>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-8">
        {/* HERO */}
        <div className={cn("relative overflow-hidden rounded-3xl border p-6 md:p-10", glass)}>
          <AccentOrbs accent={accent} />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.22em] text-white/60 uppercase">Edit Course</p>
              <h2 className="mt-2 text-[22px] md:text-[28px] font-black tracking-tight flex items-center gap-2">
                <ClipboardEdit className="h-6 w-6" /> Course Editor
              </h2>
              <p className={cn("mt-2 text-[13px] font-semibold", muted)}>
                Day-by-day videos add/update → “Save Videos (PATCH)”. Published course student UI me show hoga.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <GhostBtn onClick={() => nav("/educator/courses")}>
                <ArrowLeft className="h-4 w-4" /> Back
              </GhostBtn>

              <GhostBtn onClick={fetchOne}>
                <RefreshCw className="h-4 w-4" /> Reload
              </GhostBtn>

              <GhostBtn disabled={saving} onClick={() => saveFull("draft")}>
                <Save className="h-4 w-4" /> Update Draft
              </GhostBtn>

              <SuccessBtn disabled={saving} onClick={() => saveFull("published")}>
                <Send className="h-4 w-4" /> Publish
              </SuccessBtn>

              <DangerBtn onClick={onDelete}>
                <Trash className="h-4 w-4" /> Delete
              </DangerBtn>
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

        {/* Tabs */}
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

        {/* Body */}
        <div className="mt-5 space-y-5">
          {/* BASIC */}
          {tab === "basic" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-5", glass)}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category" muted2={muted2}>
                  <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.en}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Grade Group" muted2={muted2}>
                  <Select value={form.gradeGroup} onChange={(e) => setForm((s) => ({ ...s, gradeGroup: e.target.value }))}>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
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
              </div>
            </motion.div>
          )}

          {/* VIDEOS (PATCH) */}
          {tab === "videos" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border p-5", glass)}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black">Videos (Day-by-Day)</div>
                  <div className={cn("text-xs font-semibold", muted2)}>Add videos anytime → Save Videos (PATCH)</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <GhostBtn onClick={addVideo} className="text-[12px] px-3 py-2">
                    <Plus className="h-4 w-4" /> Add Video
                  </GhostBtn>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving}
                    onClick={patchVideosOnly}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-[12px] font-black disabled:opacity-60",
                      "bg-sky-400/15 border border-sky-300/25 hover:bg-sky-400/20 transition"
                    )}
                  >
                    Save Videos (PATCH)
                  </motion.button>
                </div>
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
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="file">File</option>
                        <option value="other">Other</option>
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
                        placeholder="Video URL (embed/link)"
                      />

                      <button
                        onClick={() => removeVideo(i)}
                        className="rounded-2xl px-3 bg-red-500/10 border border-red-400/20 hover:bg-red-500/16 transition"
                        title="Remove video"
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
      </div>
    </div>
  );
}