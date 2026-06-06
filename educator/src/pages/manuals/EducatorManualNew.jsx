import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Tag,
  Layers,
  FileText,
  Save,
  X,
  ArrowLeft,
  School as SchoolIcon,
  GraduationCap,
  Link2,
} from "lucide-react";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");

const CLASSES = ["4", "5", "6", "7", "8", "9", "10", "11", "12"];

const unwrap = (res) => res?.data ?? res ?? {};

export default function EducatorManualNew() {
  const nav = useNavigate();

  const [token, setToken] = useState(() => (localStorage.getItem("accessToken") || "").trim());

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

  const cleanToken = useMemo(
    () => String(token || "").trim().replace(/^"+|"+$/g, ""),
    [token]
  );

  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [file, setFile] = useState(null);
  const [publishNow, setPublishNow] = useState(true);

  const [assignNow, setAssignNow] = useState(true);
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [classLevel, setClassLevel] = useState("6");
  const [assignStatus, setAssignStatus] = useState("active");

  const [saving, setSaving] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsErr, setSchoolsErr] = useState("");
  const [err, setErr] = useState("");

  const tags = useMemo(() => {
    return tagsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);
  }, [tagsText]);

  const loadSchools = useCallback(async () => {
    try {
      setSchoolsErr("");

      if (!cleanToken) {
        setSchools([]);
        setSchoolId("");
        setSchoolsErr("Token missing. Please login as Educator.");
        return;
      }

      setSchoolsLoading(true);

      const res = await api.get("/educator/schools", {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = unwrap(res);

      const raw =
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.schools) ? data.schools :
        Array.isArray(data) ? data :
        [];

      const list = raw
        .map((s, index) => ({
          _id: String(s?._id || s?.id || `school-${index}`).trim(),
          name: String(s?.name || s?.schoolName || s?.title || `School ${index + 1}`).trim(),
        }))
        .filter((x) => x._id && x.name);

      console.log("MANUAL PAGE SCHOOLS RAW =", raw);
      console.log("MANUAL PAGE SCHOOLS NORMALIZED =", list);

      setSchools(list);
      setSchoolId((prev) => {
        if (prev && list.some((x) => x._id === prev)) return prev;
        return list?.[0]?._id || "";
      });
    } catch (e) {
      console.error("loadSchools error =>", e);
      setSchools([]);
      setSchoolId("");
      setSchoolsErr(getApiError(e, "Failed to load schools"));
    } finally {
      setSchoolsLoading(false);
    }
  }, [cleanToken]);

  useEffect(() => {
    if (!assignNow) return;
    loadSchools();
  }, [assignNow, loadSchools]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      return;
    }

    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Only PDF files are allowed.");
      e.target.value = "";
      setFile(null);
      return;
    }

    const max = 25 * 1024 * 1024;
    if (f.size > max) {
      alert("PDF too large. Max 25MB allowed.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const tEn = titleEn.trim();
    if (!tEn) {
      alert("Title (English) is required.");
      return;
    }
    if (!file) {
      alert("Please choose a PDF file.");
      return;
    }
    if (!cleanToken) {
      alert("Token missing. Please login again.");
      return;
    }

    if (assignNow) {
      if (!schoolId) {
        alert("Please select School to assign.");
        return;
      }
      if (!classLevel) {
        alert("Please select Class to assign.");
        return;
      }
    }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("titleEn", tEn);
      fd.append("titleHi", titleHi.trim());
      fd.append("descriptionEn", descEn.trim());
      fd.append("descriptionHi", descHi.trim());
      fd.append("category", category.trim());
      fd.append("grade", grade.trim());
      fd.append("tags", JSON.stringify(tags));
      fd.append("isPublished", String(publishNow));
      fd.append("file", file);

      const upRes = await api.post("/manuals", fd, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      });

      const upData = unwrap(upRes);
      const manual = upData?.item || upData?.manual || upData?.data || upData || {};
      const manualId = String(manual?._id || manual?.id || "").trim();

      if (!manualId) {
        throw new Error("Manual uploaded but manualId not returned by server.");
      }

      if (assignNow) {
        await api.post(
          "/educator/manual-assignments",
          {
            manualId,
            schoolId,
            classLevel: String(classLevel),
            status: assignStatus,
          },
          {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
            },
          }
        );
      }

      nav("/educator/manuals");
    } catch (e2) {
      console.error("Upload/Assign error =>", e2);
      const msg = getApiError(e2, "Upload/Assign failed");
      setErr(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.22em] text-white/55 uppercase">
            Manuals
          </p>
          <h2 className="mt-1 text-[20px] md:text-[22px] font-black">
            Upload{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Manual
            </span>
          </h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">
            PDF upload + bilingual title/description + tags. Optional: assign to School + Class.
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav(-1)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-[12px] text-white/90">
          ⚠️ {err}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[12px] font-black text-white/90 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Details
          </p>

          <div className="mt-3 grid gap-2">
            <div>
              <label className="text-[11px] font-extrabold text-white/60">Title (English)</label>
              <input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                placeholder="e.g., Arduino Basics Manual"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-white/60">Title (Hindi)</label>
              <input
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                placeholder="उदा: Arduino बेसिक्स मैनुअल"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-white/60">Description (English)</label>
              <textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                placeholder="Short summary..."
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-white/60">Description (Hindi)</label>
              <textarea
                value={descHi}
                onChange={(e) => setDescHi(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                placeholder="संक्षेप विवरण..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[12px] font-black text-white/90 flex items-center gap-2">
            <UploadCloud className="h-4 w-4" /> Upload & Assign
          </p>

          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-extrabold text-white/60">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                  placeholder="Robotics / IoT / Science..."
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-white/60">Class / Grade (Label)</label>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                  placeholder="6-8 / Class 9..."
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-white/60 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Tags (comma separated)
              </label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold"
                placeholder="arduino, sensors, basics"
              />

              {tags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold text-white/75"
                    >
                      <Layers className="h-3.5 w-3.5 opacity-80" />
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <label className="text-[11px] font-extrabold text-white/60">PDF File</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={onPickFile}
                className="mt-2 w-full text-[12px] text-white/70"
              />
              {file ? (
                <p className="mt-2 text-[12px] text-white/70 font-semibold">Selected: {file.name}</p>
              ) : (
                <p className="mt-2 text-[12px] text-white/50 font-semibold">Choose a PDF to upload.</p>
              )}
            </div>

            <label className="mt-1 inline-flex items-center gap-2 text-[12px] font-bold text-white/80">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
              />
              Publish immediately (Student UI can show if assigned)
            </label>

            <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <label className="inline-flex items-center gap-2 text-[12px] font-black text-white/90">
                <input
                  type="checkbox"
                  checked={assignNow}
                  onChange={(e) => setAssignNow(e.target.checked)}
                />
                Assign this manual to a School + Class now
              </label>

              {assignNow && (
                <div className="mt-3 grid gap-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-white/60 flex items-center gap-2">
                      <SchoolIcon className="h-4 w-4" /> School
                    </label>

                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2.5 text-[13px] text-white outline-none"
                      disabled={schoolsLoading}
                    >
                      <option value="" className="text-black">
                        {schoolsLoading ? "Loading schools..." : "Select School"}
                      </option>

                      {schools.map((s) => (
                        <option key={s._id} value={s._id} className="text-black">
                          {s.name}
                        </option>
                      ))}
                    </select>

                    {schoolsErr ? (
                      <div className="mt-2 text-[11px] text-red-200/90 font-semibold">
                        {schoolsErr}
                        <button
                          type="button"
                          onClick={loadSchools}
                          className="ml-2 underline text-white/80"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}

                    {!schoolsErr ? (
                      <div className="mt-2 text-[11px] text-white/55 font-semibold">
                        Schools loaded: <span className="text-white/85 font-black">{schools.length}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-extrabold text-white/60 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Class
                      </label>
                      <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        {CLASSES.map((c) => (
                          <option key={c} value={c} className="text-black">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold text-white/60 flex items-center gap-2">
                        <Link2 className="h-4 w-4" /> Status
                      </label>
                      <select
                        value={assignStatus}
                        onChange={(e) => setAssignStatus(e.target.value)}
                        className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        <option value="active" className="text-black">Active</option>
                        <option value="paused" className="text-black">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-white/55 font-semibold">
                    Student UI me sirf isi School + Class ke manuals show honge.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => nav("/educator/manuals")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
              >
                <X className="h-4 w-4" /> Cancel
              </button>

              <button
                disabled={saving}
                type="submit"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black transition",
                  saving
                    ? "bg-white/20 text-white/60 cursor-not-allowed"
                    : "bg-white text-slate-900 hover:bg-white/90"
                )}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : assignNow ? "Upload & Assign" : "Upload Manual"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}