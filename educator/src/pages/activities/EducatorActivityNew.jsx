// src/pages/educator/activities/EducatorActivityNew.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Video,
  Image as Img,
  FileText,
  Save,
  School as SchoolIcon,
  GraduationCap,
  Link2,
  Loader2,
} from "lucide-react";

import { createActivityApi } from "../../api/activities.api";
import { api, getApiError } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");
const emptyLS = () => ({ en: "", hi: "" });
const clampNum = (n, a, b) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));

const CLASSES = ["4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function EducatorActivityNew() {
  const nav = useNavigate();
  const token = (localStorage.getItem("accessToken") || "").trim();

  const [type, setType] = useState("video"); // video | image | text
  const [title, setTitle] = useState(emptyLS());
  const [caption, setCaption] = useState(emptyLS());
  const [badge, setBadge] = useState({ en: "STEAM", hi: "STEAM" });

  const [durationSec, setDurationSec] = useState(12);
  const [bgIndex, setBgIndex] = useState(0);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [assignNow, setAssignNow] = useState(true);
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [assignStatus, setAssignStatus] = useState("active");
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsErr, setSchoolsErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const unwrap = (res) => res?.data ?? res ?? {};

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [preview]);

  const accept = useMemo(() => {
    if (type === "video") return "video/*";
    if (type === "image") return "image/*";
    return "";
  }, [type]);

  const resetMedia = () => {
    setFile(null);
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return "";
    });
  };

  const pick = (t) => {
    setType(t);
    setStatus({ type: "", msg: "" });
    resetMedia();
    if (t !== "text") setBgIndex(0);
  };

  const onFile = (f) => {
    if (!f) return;
    setStatus({ type: "", msg: "" });

    if (type === "video" && !f.type.startsWith("video/")) {
      setStatus({ type: "err", msg: "Please choose a valid video file." });
      return;
    }

    if (type === "image" && !f.type.startsWith("image/")) {
      setStatus({ type: "err", msg: "Please choose a valid image file." });
      return;
    }

    setFile(f);
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return URL.createObjectURL(f);
    });
  };

  const loadSchools = useCallback(async () => {
  try {
    setSchoolsErr("");

    if (!token) {
      setSchools([]);
      setSchoolId("");
      setSchoolsErr("Login required. Please login again.");
      return;
    }

    setSchoolsLoading(true);

    const res = await api.get("/educator/schools", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });

    const data = unwrap(res);

    const raw = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.schools)
      ? data.schools
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    const list = raw
      .map((s, index) => ({
        _id: String(s?._id || s?.id || `school-${index}`).trim(),
        name: String(
          s?.name || s?.schoolName || s?.title || `School ${index + 1}`
        ).trim(),
      }))
      .filter((x) => x._id && x.name);

    console.log("schools parsed =>", list);

    setSchools(list);

    setSchoolId((prev) => {
      if (prev && list.some((x) => x._id === prev)) return prev;
      return "";
    });
  } catch (e) {
    console.error("loadSchools error =>", e);
    setSchools([]);
    setSchoolId("");
    setSchoolsErr(getApiError(e, "Failed to load schools"));
  } finally {
    setSchoolsLoading(false);
  }
}, [token]);

  useEffect(() => {
    if (!assignNow) return;
    loadSchools();
  }, [assignNow, loadSchools]);

  const canSubmit = useMemo(() => {
    const hasText =
      title.en.trim() ||
      title.hi.trim() ||
      caption.en.trim() ||
      caption.hi.trim();

    const hasContent = type === "text" ? !!hasText : !!file;

    if (!hasContent) return false;
    if (assignNow && !schoolId) return false;
    if (assignNow && !classLevel) return false;

    return true;
  }, [type, title, caption, file, assignNow, schoolId, classLevel]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    if (!canSubmit) {
      setStatus({
        type: "err",
        msg: "Please add content and select school/class before posting.",
      });
      return;
    }

    try {
      setLoading(true);

      const safeDuration = clampNum(Number(durationSec), 5, 60);
      const safeBg = clampNum(Number(bgIndex), 0, 2);

      let data;

      if (type === "text") {
        data = await createActivityApi({
          type,
          durationSec: safeDuration,
          bgIndex: safeBg,
          title,
          caption,
          badge,
          schoolId: assignNow ? schoolId : "",
          classLevel: assignNow ? String(classLevel) : "",
          status: assignNow ? assignStatus : "active",
        });
      } else {
        const fd = new FormData();
        fd.append("type", type);
        fd.append("durationSec", String(safeDuration));
        fd.append("bgIndex", String(safeBg));
        fd.append("title", JSON.stringify(title));
        fd.append("caption", JSON.stringify(caption));
        fd.append("badge", JSON.stringify(badge));

        if (assignNow) {
          fd.append("schoolId", String(schoolId));
          fd.append("classLevel", String(classLevel));
          fd.append("status", String(assignStatus));
        }

        if (file) fd.append("file", file);

        data = await createActivityApi(fd);
      }

      if (!data?.ok) {
        throw new Error(data?.message || "Failed to post");
      }

      setStatus({ type: "ok", msg: "Activity posted successfully ✅" });

      timeoutRef.current = setTimeout(() => {
        nav("/educator/activities", { state: { refresh: true } });
      }, 400);
    } catch (err) {
      setStatus({
        type: "err",
        msg: getApiError(err, "Failed to post activity"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-extrabold tracking-[0.18em]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            NEW ACTIVITY
          </div>
          <h2 className="mt-2 text-[18px] sm:text-[20px] font-black">Post Activity</h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">
            Upload video/image or write a note — it will appear only for selected school and class.
          </p>
        </div>

        <button
          type="button"
          onClick={() => nav(-1)}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
            "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { key: "video", icon: Video, title: "Video", desc: "Post short status video (recommended)" },
          { key: "image", icon: Img, title: "Image", desc: "Share photo/screenshot of activity" },
          { key: "text", icon: FileText, title: "Text Note", desc: "Write a micro challenge / note" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item.key)}
              className={cn(
                "rounded-[22px] p-4 border transition text-left",
                type === item.key
                  ? "bg-white/10 border-white/18"
                  : "bg-white/[0.04] hover:bg-white/[0.07] border-white/10"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-white/80" />
                <p className="text-[13px] font-black">{item.title}</p>
              </div>
              <p className="mt-1 text-[11px] text-white/65 font-semibold">{item.desc}</p>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        {(type === "video" || type === "image") && (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
            <p className="text-[12px] font-black">Upload {type}</p>
            <p className="mt-1 text-[11px] text-white/65 font-semibold">
              {type === "video" ? "Tip: 10–20 sec works best." : "Use clear photo with good lighting."}
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition cursor-pointer w-fit">
                <Upload className="h-4 w-4" />
                Choose File
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>

              {file && (
                <div className="text-[11px] text-white/70 font-semibold truncate">
                  Selected: <span className="text-white">{file.name}</span>
                </div>
              )}

              {file && (
                <button
                  type="button"
                  onClick={resetMedia}
                  className="text-[11px] font-extrabold text-white/70 hover:text-white transition w-fit"
                >
                  Remove
                </button>
              )}
            </div>

            {preview && type === "image" && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                <img src={preview} alt="preview" className="w-full max-h-[360px] object-cover" />
              </div>
            )}

            {preview && type === "video" && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                <video src={preview} controls className="w-full max-h-[360px] object-cover bg-black" />
              </div>
            )}
          </div>
        )}

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[12px] font-black">School + Class Assignment</p>

          <label className="mt-3 inline-flex items-center gap-2 text-[12px] font-black text-white/90">
            <input
              type="checkbox"
              checked={assignNow}
              onChange={(e) => setAssignNow(e.target.checked)}
            />
            Assign this activity to a School + Class now
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
                ) : (
                  <div className="mt-2 text-[11px] text-white/55 font-semibold">
                    Schools loaded: <span className="text-white/85 font-black">{schools.length}</span>
                  </div>
                )}
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
                    <option value="" className="text-black">
                      Select Class
                    </option>
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
                Student UI me sirf isi School + Class ke assigned activities show honi chahiye.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[12px] font-black">Content</p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Title (EN)</p>
              <input
                value={title.en}
                onChange={(e) => setTitle((p) => ({ ...p, en: e.target.value }))}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="e.g. Today’s Challenge"
              />
            </div>

            <div>
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Title (HI)</p>
              <input
                value={title.hi}
                onChange={(e) => setTitle((p) => ({ ...p, hi: e.target.value }))}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="उदा. आज की चुनौती"
              />
            </div>

            <div className="md:col-span-2">
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Caption / Note (EN)</p>
              <textarea
                value={caption.en}
                onChange={(e) => setCaption((p) => ({ ...p, en: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="Explain steps in 1–2 lines…"
              />
            </div>

            <div className="md:col-span-2">
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Caption / Note (HI)</p>
              <textarea
                value={caption.hi}
                onChange={(e) => setCaption((p) => ({ ...p, hi: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="1–2 लाइन में समझाएँ…"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4">
          <p className="text-[12px] font-black">Settings</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Duration (sec)</p>
              <input
                type="number"
                min={5}
                max={60}
                value={durationSec}
                onChange={(e) => setDurationSec(clampNum(Number(e.target.value), 5, 60))}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
              />
            </div>

            <div>
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Badge (EN)</p>
              <input
                value={badge.en}
                onChange={(e) => setBadge((p) => ({ ...p, en: e.target.value }))}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="ROBOTICS"
              />
            </div>

            <div>
              <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">Badge (HI)</p>
              <input
                value={badge.hi}
                onChange={(e) => setBadge((p) => ({ ...p, hi: e.target.value }))}
                className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                placeholder="रोबोटिक्स"
              />
            </div>

            {type === "text" && (
              <div>
                <p className="text-[11px] text-white/70 font-extrabold tracking-[0.16em] uppercase">BG Index (0-2)</p>
                <input
                  type="number"
                  min={0}
                  max={2}
                  value={bgIndex}
                  onChange={(e) => setBgIndex(clampNum(Number(e.target.value), 0, 2))}
                  className="mt-2 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                />
              </div>
            )}
          </div>
        </div>

        {status.msg && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-[12px] font-semibold border",
              status.type === "ok"
                ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-100"
                : "bg-red-500/10 border-red-400/20 text-red-100"
            )}
          >
            {status.msg}
          </div>
        )}

        <div className="flex justify-end">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !canSubmit}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-black",
              "bg-gradient-to-r from-sky-400/25 via-indigo-400/20 to-fuchsia-400/20",
              "border border-white/12 hover:border-white/20 transition shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
              loading || !canSubmit ? "opacity-60 cursor-not-allowed" : ""
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "Posting..." : "Post Activity"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}