import React, { useState, useEffect, useCallback } from "react";
import { UploadCloud, CheckCircle, FileText, Image as ImageIcon, School, Users, BookOpen, Lightbulb, Pickaxe, Loader2, X } from "lucide-react";
import { submitDailyReport } from "../api/reports.api";
import { api } from "../api/axios";

const CLASSES = ["4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function SubmitReport() {
  const [formData, setFormData] = useState({
    schoolName: "",
    visitDate: new Date().toISOString().split("T")[0],
    studentCount: "",
    classesTaught: "",
    topicsTaught: "",
    projectBuilt: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  const token = (localStorage.getItem("accessToken") || "").trim();

  const loadSchools = useCallback(async () => {
    if (!token) return;
    try {
      setSchoolsLoading(true);
      const res = await api.get("/educator/schools", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      const data = res?.items || res?.schools || res?.data || res || [];
      const list = (Array.isArray(data) ? data : [])
        .map((s, index) => ({
          _id: String(s?._id || s?.id || `school-${index}`).trim(),
          name: String(s?.name || s?.schoolName || s?.title || `School ${index + 1}`).trim(),
        }))
        .filter((x) => x._id && x.name);
      setSchools(list);
    } catch (e) {
      console.error("Failed to load schools:", e);
    } finally {
      setSchoolsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setErrorMsg("You can only upload up to 5 images.");
      return;
    }
    setImages(prev => [...prev, ...files]);
    setErrorMsg("");
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setErrorMsg("Please upload at least 1 image of your visit.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      images.forEach(img => data.append("images", img));

      const res = await submitDailyReport(data);
      if (res?.ok) {
        setSuccess(true);
        setFormData({
          schoolName: "",
          visitDate: new Date().toISOString().split("T")[0],
          studentCount: "",
          classesTaught: "",
          topicsTaught: "",
          projectBuilt: "",
        });
        setImages([]);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Report Submitted!</h2>
        <p className="text-white/60 mb-8 font-semibold">Your daily school visit report has been successfully sent to the admin.</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 hover:border-white/30 transition shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-black/25 border border-white/10 rounded-2xl focus:bg-black/40 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition text-white placeholder:text-white/30 font-medium";
  const labelClass = "text-sm font-bold text-white/80 flex items-center gap-2 mb-2";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-fuchsia-400" />
          Daily School Visit Report
        </h1>
        <p className="text-white/60 mt-1 font-semibold">Fill out the details of your school visit below.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] rounded-[28px] p-6 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.8),transparent_60%)]" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* School Name */}
          <div>
            <label className={labelClass}>
              <School className="w-4 h-4 text-white/50" /> School Name
            </label>
            <select
              required
              value={formData.schoolName}
              onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
              className={inputClass + (formData.schoolName ? "" : " text-white/40")}
              disabled={schoolsLoading}
            >
              <option value="" disabled>
                {schoolsLoading ? "Loading schools..." : "Select a School"}
              </option>
              {schools.map(s => (
                <option key={s._id} value={s.name} className="text-black">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Date */}
          <div>
            <label className={labelClass}>
              Date of Visit
            </label>
            <input
              required
              type="date"
              value={formData.visitDate}
              onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
              className={inputClass + " [color-scheme:dark]"}
            />
          </div>

          {/* Student Count */}
          <div>
            <label className={labelClass}>
              <Users className="w-4 h-4 text-white/50" /> Number of Students
            </label>
            <input
              required
              type="number"
              min="1"
              placeholder="e.g. 45"
              value={formData.studentCount}
              onChange={e => setFormData({ ...formData, studentCount: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Classes */}
          <div>
            <label className={labelClass}>
              <BookOpen className="w-4 h-4 text-white/50" /> Class Taught
            </label>
            <select
              required
              value={formData.classesTaught}
              onChange={e => setFormData({ ...formData, classesTaught: e.target.value })}
              className={inputClass + (formData.classesTaught ? "" : " text-white/40")}
            >
              <option value="" disabled>Select a Class</option>
              {CLASSES.map(c => (
                <option key={c} value={`Class ${c}`} className="text-black">
                  Class {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Topic */}
          <div>
            <label className={labelClass}>
              <Lightbulb className="w-4 h-4 text-white/50" /> Topic Taught
            </label>
            <textarea
              required
              rows={3}
              placeholder="What concepts were covered?"
              value={formData.topicsTaught}
              onChange={e => setFormData({ ...formData, topicsTaught: e.target.value })}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Project */}
          <div>
            <label className={labelClass}>
              <Pickaxe className="w-4 h-4 text-white/50" /> Project Built
            </label>
            <textarea
              required
              rows={3}
              placeholder="What did the students build?"
              value={formData.projectBuilt}
              onChange={e => setFormData({ ...formData, projectBuilt: e.target.value })}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4 pt-4 border-t border-white/10 relative">
          <div className="flex items-center justify-between">
            <label className={labelClass + " !mb-0"}>
              <ImageIcon className="w-4 h-4 text-white/50" /> Visit Photos (Upload images)
            </label>
            <span className="text-xs font-bold text-white/50">{images.length}/5 Images</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((file, idx) => (
              <div key={idx} className="relative w-32 h-32 shrink-0 rounded-2xl overflow-hidden border border-white/10 group">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm">
                  <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition border border-red-400/50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {images.length < 5 && (
              <label className="w-32 h-32 shrink-0 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/50 hover:text-white/80 hover:border-white/40 hover:bg-white/5 transition cursor-pointer bg-black/20">
                <UploadCloud className="w-6 h-6 mb-2 text-white/40" />
                <span className="text-[11px] font-black tracking-wider uppercase">Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 relative">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-400/80 via-indigo-500/80 to-fuchsia-500/80 hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-500 text-white rounded-2xl font-black transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? "Submitting Report..." : "Submit Daily Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
