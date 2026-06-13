import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Save,
  Loader2,
  X,
  Plus,
  GraduationCap,
  Link2,
} from "lucide-react";
import { api, getApiError } from "../../api/axios";
import SchoolClassChecklist from "../../components/SchoolClassChecklist";

const cn = (...s) => s.filter(Boolean).join(" ");
const unwrap = (res) => res?.data ?? res ?? {};

const TRACKS = [
  "3D Printing & Designing",
  "Electronics",
  "Scratch Programming",
  "Robotics",
  "IoT",
  "App Development",
  "C++",
  "Python",
];

const CLASSES = ["4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function ProjectCreate() {
  const nav = useNavigate();
  const token = (localStorage.getItem("accessToken") || "").trim();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [track, setTrack] = useState("Robotics");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("30-45 min");

  const [videoUrl, setVideoUrl] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [outcomes, setOutcomes] = useState([""]);
  const [projects, setProjects] = useState([""]);

  const [assignNow, setAssignNow] = useState(true);
  const [targetSchools, setTargetSchools] = useState([]);
  const [targetClasses, setTargetClasses] = useState([]);
  const [assignStatus, setAssignStatus] = useState("active");

  const normalizeUrl = (v) => String(v || "").trim();

  const cleanList = (arr) =>
    arr.map((x) => String(x || "").trim()).filter(Boolean);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!track) return false;
    if (!normalizeUrl(videoUrl)) return false;
    if (assignNow && targetSchools.length === 0) return false;
    if (assignNow && targetClasses.length === 0) return false;
    return true;
  }, [title, track, videoUrl, assignNow, targetSchools, targetClasses]);

  // loadSchools is not needed since SchoolClassChecklist fetches internally

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const setListItem = (setter) => (idx, val) => {
    setter((prev) => prev.map((x, i) => (i === idx ? val : x)));
  };

  const addListItem = (setter) => () => {
    setter((prev) => [...prev, ""]);
  };

  const removeListItem = (setter) => (idx) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async () => {
    if (saving) return;

    try {
      setErr("");

      if (!token) {
        setErr("Login required. Please login again.");
        return;
      }

      if (!canSubmit) {
        setErr("Please fill required fields properly.");
        return;
      }

      setSaving(true);

      const payload = {
        title: {
          en: title.trim(),
          hi: title.trim(),
        },
        category: track,
        description: description.trim(),
        level: {
          en: level.trim(),
          hi: level.trim(),
        },
        duration: {
          en: duration.trim(),
          hi: duration.trim(),
        },
        videoUrl: normalizeUrl(videoUrl),
        thumbUrl: normalizeUrl(thumbUrl),
        resourceUrl: normalizeUrl(resourceUrl),
        tags: cleanList(tags),
        outcomes: cleanList(outcomes),
        projects: cleanList(projects),
      };

      const createRes = await api.post("/projects", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createData = unwrap(createRes);
      const created =
        createData?.data ||
        createData?.project ||
        createData?.item ||
        createData ||
        {};

      const createdId = created?._id || created?.id || "";

      if (!createdId) {
        throw new Error("Project created but project id not returned by server.");
      }

      if (assignNow) {
        await api.post(
          "/educator/project-assignments",
          {
            projectId: createdId,
            targetSchools,
            targetClasses,
            status: String(assignStatus || "active"),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      nav("/educator/projects", {
        replace: true,
        state: {
          toast: assignNow
            ? "Project uploaded and assigned successfully"
            : "Project uploaded successfully",
        },
      });
    } catch (e) {
      console.error("project create error =>", e);
      setErr(
        getApiError?.(e, "Failed to upload project") ||
          e?.message ||
          "Failed to upload project"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
            Upload Project
          </p>
          <h2 className="mt-1 text-[18px] md:text-[20px] font-black">
            Create{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Video Project
            </span>
          </h2>
          <p className="mt-1 text-[12px] text-white/65 font-semibold">
            Sirf selected school aur class ke students ko ye project dikhna chahiye.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={onSubmit}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              !canSubmit || saving
                ? "bg-white/10 border border-white/10 text-white/45 cursor-not-allowed"
                : "bg-white text-slate-950 border border-white hover:opacity-95"
            )}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : assignNow ? "Publish & Assign" : "Publish"}
          </button>
        </div>
      </div>

      {!!err && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] font-semibold text-red-100">
          {err}
        </div>
      )}

      <div className="mt-5 grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
              Basic Info
            </p>

            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-extrabold text-white/75">Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Line Follower Robot (Part 1)"
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/75">Track *</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t} className="text-black">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/75">Level</label>
                <input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Beginner / Intermediate / Advanced"
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/75">Duration</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30-45 min"
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[12px] font-extrabold text-white/75">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short brief about the project..."
                rows={4}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 resize-none bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
              Video & Resources
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[12px] font-extrabold text-white/75 flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video URL *
                </label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube link OR direct mp4 URL"
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/75 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Thumbnail URL
                </label>
                <input
                  value={thumbUrl}
                  onChange={(e) => setThumbUrl(e.target.value)}
                  placeholder="Optional poster image URL"
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/75 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Resource URL
                </label>
                <input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="Optional: PDF/Drive link/github etc."
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
                Learning Outcomes
              </p>
              <button
                type="button"
                onClick={addListItem(setOutcomes)}
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {outcomes.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={v}
                    onChange={(e) => setListItem(setOutcomes)(i, e.target.value)}
                    placeholder={`Outcome ${i + 1}`}
                    className="w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                  />
                  {outcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem(setOutcomes)(i)}
                      className="rounded-2xl p-2 bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/15 transition"
                    >
                      <X className="h-4 w-4 text-white/80" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
                Hands-on Projects / Steps
              </p>
              <button
                type="button"
                onClick={addListItem(setProjects)}
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-black bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {projects.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={v}
                    onChange={(e) => setListItem(setProjects)(i, e.target.value)}
                    placeholder={`Item ${i + 1}`}
                    className="w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
                  />
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem(setProjects)(i)}
                      className="rounded-2xl p-2 bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/15 transition"
                    >
                      <X className="h-4 w-4 text-white/80" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
              Tags
            </p>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., Arduino, Sensors, PWM"
                className="w-full rounded-2xl px-3 py-2.5 bg-black/25 border border-white/10 focus:border-white/20 outline-none text-[13px] font-semibold text-white placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-2xl px-3 py-2.5 text-[13px] font-black bg-white text-slate-950 border border-white hover:opacity-95"
              >
                Add
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <div className="text-[12px] text-white/55 font-semibold">No tags added.</div>
              ) : (
                tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-extrabold bg-white/8 border border-white/10 text-white/85"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="opacity-80 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <label className="inline-flex items-center gap-2 text-[12px] font-black text-white/90">
              <input
                type="checkbox"
                checked={assignNow}
                onChange={(e) => setAssignNow(e.target.checked)}
              />
              Assign this project to a School + Class now
            </label>

            {assignNow && (
              <div className="mt-3 grid gap-2">
                <SchoolClassChecklist
                  selectedSchools={targetSchools}
                  onChangeSchools={setTargetSchools}
                  selectedClasses={targetClasses}
                  onChangeClasses={setTargetClasses}
                />

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-white/60 flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> Status
                    </label>
                    <select
                      value={assignStatus}
                      onChange={(e) => setAssignStatus(e.target.value)}
                      className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-3 py-2.5 text-[13px] text-white outline-none"
                    >
                      <option value="active" className="text-black">
                        Active
                      </option>
                      <option value="paused" className="text-black">
                        Paused
                      </option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-white/55 font-semibold">
                  Sirf isi selected school aur class ke students ko ye project dikhna chahiye.
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-white/55">
              Publish Checklist
            </p>

            <div className="mt-3 space-y-2 text-[12px] font-semibold">
              <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 border", title.trim() ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                <span>Title</span>
                <span className={cn(title.trim() ? "text-emerald-200" : "text-white/55")}>
                  {title.trim() ? "OK" : "Required"}
                </span>
              </div>

              <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 border", track ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                <span>Track</span>
                <span className={cn(track ? "text-emerald-200" : "text-white/55")}>
                  {track ? "OK" : "Required"}
                </span>
              </div>

              <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 border", videoUrl.trim() ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                <span>Video URL</span>
                <span className={cn(videoUrl.trim() ? "text-emerald-200" : "text-white/55")}>
                  {videoUrl.trim() ? "OK" : "Required"}
                </span>
              </div>

              {assignNow && (
                <>
                  <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 border", targetSchools.length > 0 ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                    <span>School Assignment</span>
                    <span className={cn(targetSchools.length > 0 ? "text-emerald-200" : "text-white/55")}>
                      {targetSchools.length > 0 ? "OK" : "Required"}
                    </span>
                  </div>

                  <div className={cn("flex items-center justify-between rounded-2xl px-3 py-2 border", targetClasses.length > 0 ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                    <span>Class Assignment</span>
                    <span className={cn(targetClasses.length > 0 ? "text-emerald-200" : "text-white/55")}>
                      {targetClasses.length > 0 ? "OK" : "Required"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={onSubmit}
              className={cn(
                "mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-black",
                !canSubmit || saving
                  ? "bg-white/10 border border-white/10 text-white/45 cursor-not-allowed"
                  : "bg-white text-slate-950 border border-white hover:opacity-95"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {saving ? "Publishing..." : assignNow ? "Publish & Assign Project" : "Publish Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}