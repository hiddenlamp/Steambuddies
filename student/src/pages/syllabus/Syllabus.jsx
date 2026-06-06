// ✅ UPDATED: src/pages/syllabus/Syllabus.jsx
// Fixes:
// 1) Cards are now FULL COLOR (no white card base)
// 2) Each card has its OWN "Download" button (exports that single track PDF)
// 3) "Syllabus" heading is now ALWAYS visible in light mode (gradient + fallback + stroke)

import React, { useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Download,
  Search,
  SlidersHorizontal,
  Boxes,
  Cpu,
  Layers,
  Bot,
  Wifi,
  AppWindow,
  Code2,
  TerminalSquare,
  CheckCircle2,
  FileText,
  X,
  ArrowUpRight,
} from "lucide-react";
import jsPDF from "jspdf";

const cn = (...s) => s.filter(Boolean).join(" ");

/* ------------------------- tiny 3D tilt hook ------------------------- */
function useTilt(max = 10) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (max / 2 - py * max).toFixed(2);
    const ry = (px * max - max / 2).toFixed(2);
    setStyle({
      transform: `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`,
    });
  };
  const onLeave = () =>
    setStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)",
    });
  return { ref, style, onMove, onLeave };
}

/* ----------------------------- PDF EXPORT ---------------------------- */
function exportSyllabusPDF({ title, subtitle, tracks, filename = "Syllabus_Project_First.pdf" }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 44;

  const wrap = (text, maxW) => doc.splitTextToSize(text, maxW);

  let y = 64;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(wrap(subtitle, pageW - margin * 2), margin, y);

  y += 18;
  doc.setDrawColor(30);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  tracks.forEach((t, idx) => {
    const head = `${idx + 1}. ${t.title}  (${t.level})`;
    const tagline = t.tagline;
    const tools = `Tools: ${t.tools}`;
    const projects = t.projects.map((p) => `• ${p}`).join("\n");

    const approxLines =
      wrap(head, pageW - margin * 2).length +
      wrap(tagline, pageW - margin * 2).length +
      wrap(tools, pageW - margin * 2).length +
      wrap(projects, pageW - margin * 2).length;

    const approxHeight = approxLines * 14 + 56;

    if (y + approxHeight > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(wrap(head, pageW - margin * 2), margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(wrap(tagline, pageW - margin * 2), margin, y);
    y += 16;

    doc.text(wrap(tools, pageW - margin * 2), margin, y);
    y += 16;

    doc.text(wrap(projects, pageW - margin * 2), margin, y);
    y += 18;

    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  });

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Generated from Syllabus page", margin, pageH - 18);

  doc.save(filename);
}

/* ---------------------------- UI components -------------------------- */
function GradientChip({ icon: Icon, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1",
        "text-[10px] font-black tracking-[0.18em] text-white",
        "bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-700",
        "shadow-[0_14px_40px_rgba(79,70,229,0.30)]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function SoftChip({ icon: Icon, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1",
        "text-[10px] font-black tracking-[0.18em]",
        "border border-black/10 bg-white/70 text-slate-900 backdrop-blur",
        "dark:border-white/10 dark:bg-white/10 dark:text-white/90"
      )}
    >
      <Icon className="h-3.5 w-3.5 opacity-90" />
      {children}
    </span>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-[11px] font-extrabold tracking-wide transition",
        "border backdrop-blur",
        active
          ? "border-white/10 text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-700 shadow-[0_14px_40px_rgba(79,70,229,0.30)]"
          : "border-black/10 bg-white/70 text-slate-900 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white/85 dark:hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

function TrackModal({ open, onClose, track }) {
  const reduce = useReducedMotion();
  if (!open || !track) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center px-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          aria-label="close"
          onClick={onClose}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className={cn(
            "relative w-full max-w-2xl overflow-hidden rounded-[28px] border",
            "border-black/10 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.25)]",
            "dark:border-white/10 dark:bg-[#0B1020] dark:shadow-[0_30px_120px_rgba(0,0,0,0.60)]"
          )}
        >
          <div className={cn("absolute inset-0 opacity-95 bg-gradient-to-br", track.panel)} />
          <div className="absolute inset-0 opacity-[0.18]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
          </div>

          <div className="relative p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur">
                  <track.icon className="h-6 w-6 text-white" />
                </span>
                <div>
                  <div className="text-[16px] font-black text-white">{track.title}</div>
                  <div className="text-[12px] text-white/85">{track.tagline}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl p-2 ring-1 ring-white/25 bg-white/15 hover:bg-white/25 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <SoftChip icon={Sparkles}>{track.level}</SoftChip>
              <SoftChip icon={FileText}>Tools: {track.tools}</SoftChip>
            </div>

            <div className="mt-4 grid gap-2">
              {track.projects.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-2xl bg-white/14 ring-1 ring-white/20 px-3 py-2"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-white/90" />
                  <div className="text-[12px] font-bold text-white">{p}</div>
                </div>
              ))}
            </div>

            {!reduce && (
              <motion.div
                aria-hidden
                animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
                transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-white/18 blur-3xl"
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TrackCard({ track, index, onOpen, onDownloadTrack }) {
  const reduce = useReducedMotion();
  const tilt = useTilt(10);

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(track)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: index * 0.03 }}
      className="group relative text-left"
    >
      {/* glow */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-1 rounded-[30px] opacity-80 blur-2xl",
          "bg-gradient-to-r",
          track.glow
        )}
      />

      <div
        ref={tilt.ref}
        onMouseMove={reduce ? undefined : tilt.onMove}
        onMouseLeave={reduce ? undefined : tilt.onLeave}
        style={reduce ? undefined : tilt.style}
        className={cn(
          "relative overflow-hidden rounded-[30px] p-5 md:p-6 transition-transform duration-200",
          // ✅ NO WHITE BASE anymore:
          "ring-1 ring-black/10 bg-transparent shadow-[0_22px_70px_rgba(0,0,0,0.14)]",
          "dark:ring-white/10 dark:shadow-[0_22px_70px_rgba(0,0,0,0.55)]"
        )}
      >
        {/* full color panel */}
        <div className={cn("absolute inset-0 opacity-95 bg-gradient-to-br", track.panel)} />

        {/* pattern */}
        <div className="absolute inset-0 opacity-[0.18]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
        </div>

        {/* readability fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/45 dark:to-black/60" />

        {/* ✅ per-card download button */}
        <div className="absolute right-4 top-4 z-20">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onDownloadTrack(track);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-black",
              "bg-white/18 text-white ring-1 ring-white/25 backdrop-blur",
              "hover:bg-white/24"
            )}
          >
            <Download className="h-4 w-4" />
            Download
          </motion.button>
        </div>

        {/* content */}
        <div className="relative z-10 pt-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/25 backdrop-blur">
                <track.icon className="h-6 w-6 text-white" />
              </span>

              <div className="min-w-0">
                <div className="truncate text-[15px] font-black text-white">{track.title}</div>
                <div className="mt-0.5 text-[12px] text-white/85">{track.tagline}</div>
              </div>
            </div>

            <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black tracking-[0.18em] bg-white/18 ring-1 ring-white/20 text-white">
              {track.level}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {track.projects.slice(0, 3).map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-2xl bg-white/14 ring-1 ring-white/20 px-3 py-2"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-white/90" />
                <div className="text-[12px] font-bold text-white">{p}</div>
              </div>
            ))}
            {track.projects.length > 3 && (
              <div className="text-[11px] font-extrabold text-white/85 px-1 flex items-center gap-1">
                + {track.projects.length - 3} more <ArrowUpRight className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/18 ring-1 ring-white/20">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "78%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={cn("h-full rounded-full bg-gradient-to-r", track.accent)}
              />
            </div>

            <div className="mt-2 text-[11px] text-white/85">
              Tools: <span className="font-semibold text-white">{track.tools}</span>
            </div>
          </div>
        </div>

        {/* hover shine */}
        <div className="pointer-events-none absolute -top-16 left-1/3 h-56 w-56 rotate-12 rounded-full bg-white/25 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </motion.button>
  );
}

/* ------------------------------- PAGE -------------------------------- */
export default function Syllabus() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [openTrack, setOpenTrack] = useState(null);

  const TRACKS = useMemo(
    () => [
      {
        id: "3d",
        group: "core",
        title: "3D Printing & Designing",
        tagline: "Design → slice → print → present like a maker.",
        level: "BEGINNER → PRO",
        icon: Boxes,
        tools: "Tinkercad / Fusion 360 • Cura",
        accent: "from-slate-200 via-indigo-300 to-sky-300",
        glow: "from-slate-500/25 via-indigo-500/25 to-sky-500/25",
        panel: "from-slate-800 via-indigo-800 to-sky-800",
        projects: ["Keychain & Nameplate", "Phone Stand", "Mini Gear Mechanism", "Prototype Product Model"],
      },
      {
        id: "electronics",
        group: "core",
        title: "Electronics",
        tagline: "Sensors, wiring, logic — build real circuits.",
        level: "FOUNDATION",
        icon: Cpu,
        tools: "Breadboard • Sensors • Multimeter",
        accent: "from-emerald-300 via-cyan-300 to-sky-300",
        glow: "from-emerald-500/30 via-cyan-500/30 to-sky-500/30",
        panel: "from-emerald-600 via-cyan-600 to-sky-700",
        projects: ["Smart Night Lamp", "Buzzer Alarm", "Temperature Monitor", "Traffic Light System"],
      },
      {
        id: "scratch",
        group: "coding",
        title: "Scratch Programming",
        tagline: "Games, stories & logic — coding without fear.",
        level: "KIDS + BEGINNER",
        icon: Layers,
        tools: "Scratch • Creativity • Logic",
        accent: "from-amber-300 via-orange-300 to-rose-300",
        glow: "from-amber-500/30 via-orange-500/30 to-rose-500/30",
        panel: "from-amber-600 via-orange-600 to-rose-700",
        projects: ["Maze Game", "Quiz App", "Animation Story", "Score & Levels Game"],
      },
      {
        id: "robotics",
        group: "core",
        title: "Robotics",
        tagline: "Build, code & control robots with confidence.",
        level: "PROJECT-FIRST",
        icon: Bot,
        tools: "Arduino • Motors • Sensors",
        accent: "from-violet-300 via-fuchsia-300 to-rose-300",
        glow: "from-violet-500/30 via-fuchsia-500/30 to-rose-500/30",
        panel: "from-violet-700 via-fuchsia-700 to-rose-700",
        projects: ["Line Follower Robot", "Obstacle Avoider", "Bluetooth Car", "Mini Robotic Arm Basics"],
      },
      {
        id: "iot",
        group: "core",
        title: "IoT (Internet of Things)",
        tagline: "Connect devices to cloud and control them.",
        level: "SMART SYSTEMS",
        icon: Wifi,
        tools: "ESP32/NodeMCU • Dashboard",
        accent: "from-violet-300 via-fuchsia-300 to-rose-300",
        glow: "from-violet-500/30 via-fuchsia-500/30 to-rose-500/30",
        panel: "from-violet-700 via-fuchsia-700 to-rose-700",
        projects: ["Smart Home Switch", "Live Sensor Dashboard", "IoT Weather Station", "Alert System (Gas/Water)"],
      },
      {
        id: "appdev",
        group: "coding",
        title: "App Development",
        tagline: "UI → navigation → storage → publish mindset.",
        level: "MODERN APPS",
        icon: AppWindow,
        tools: "Flutter/React • Firebase",
        accent: "from-indigo-300 via-sky-300 to-emerald-300",
        glow: "from-indigo-500/30 via-sky-500/30 to-emerald-500/30",
        panel: "from-indigo-700 via-sky-700 to-emerald-700",
        projects: ["Notes App", "Attendance App", "Quiz App", "STEM Showcase App"],
      },
      {
        id: "cpp",
        group: "coding",
        title: "C++ Programming",
        tagline: "Logic, structures & problem-solving for robotics.",
        level: "CORE CS",
        icon: Code2,
        tools: "C++ • DSA Basics",
        accent: "from-slate-200 via-indigo-300 to-sky-300",
        glow: "from-slate-500/25 via-indigo-500/25 to-sky-500/25",
        panel: "from-slate-800 via-indigo-800 to-sky-800",
        projects: ["Calculator", "Arrays & Patterns", "Mini Student Record System", "Basic OOP Project"],
      },
      {
        id: "python",
        group: "coding",
        title: "Python Programming",
        tagline: "From basics to automation + AI-ready skills.",
        level: "FAST + POWERFUL",
        icon: TerminalSquare,
        tools: "Python • Projects • AI Basics",
        accent: "from-emerald-300 via-sky-300 to-indigo-300",
        glow: "from-emerald-500/25 via-sky-500/25 to-indigo-500/25",
        panel: "from-emerald-700 via-sky-700 to-indigo-800",
        projects: ["Automation Scripts", "Data Mini Project", "GUI Mini App", "AI Mini Demo (Basics)"],
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TRACKS.filter((t) => {
      const groupOk = active === "all" ? true : t.group === active;
      const text = `${t.title} ${t.tagline} ${t.tools} ${t.projects.join(" ")}`.toLowerCase();
      const qOk = q ? text.includes(q) : true;
      return groupOk && qOk;
    });
  }, [TRACKS, query, active]);

  // ✅ page download (all/filtered)
  const onDownload = useCallback(() => {
    exportSyllabusPDF({
      title: "Your Syllabus — built with Projects",
      subtitle:
        "3D Printing & Designing • Electronics • Scratch • Robotics • IoT • App Development • C++ • Python",
      tracks: filtered.length ? filtered : TRACKS,
      filename: "Syllabus_Project_First.pdf",
    });
  }, [filtered, TRACKS]);

  // ✅ per-card download (single track)
  const onDownloadTrack = useCallback((track) => {
    exportSyllabusPDF({
      title: `Syllabus — ${track.title}`,
      subtitle: `${track.level} • Tools: ${track.tools}`,
      tracks: [track],
      filename: `Syllabus_${track.id}.pdf`,
    });
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen",
        "bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(56,189,248,0.40),transparent_45%),radial-gradient(1000px_circle_at_90%_10%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(900px_circle_at_70%_92%,rgba(217,70,239,0.25),transparent_50%),linear-gradient(to_bottom,#ffffff,#f7f8ff)]",
        "dark:bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(56,189,248,0.14),transparent_45%),radial-gradient(1000px_circle_at_90%_10%,rgba(99,102,241,0.14),transparent_45%),radial-gradient(900px_circle_at_70%_92%,rgba(217,70,239,0.10),transparent_50%),linear-gradient(to_bottom,#060913,#02040b)]"
      )}
    >
      <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        {/* top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/home")}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[12px] font-extrabold",
              "border border-black/10 bg-white/80 text-slate-950 shadow-sm backdrop-blur hover:bg-white",
              "dark:border-white/10 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/15"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </motion.button>

          <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
            <GradientChip icon={Sparkles}>PROJECT-FIRST SYLLABUS</GradientChip>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onDownload}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[12px] font-black",
                "bg-slate-900 text-white shadow-[0_16px_50px_rgba(2,6,23,0.25)] hover:brightness-110 active:brightness-95",
                "dark:bg-white dark:text-slate-950"
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </motion.button>
          </div>
        </div>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={cn(
            "relative mt-5 overflow-hidden rounded-[34px] border",
            "border-black/10 bg-white shadow-[0_28px_120px_rgba(0,0,0,0.14)]",
            "dark:border-white/10 dark:bg-[#0B1020]/70 dark:shadow-[0_28px_120px_rgba(0,0,0,0.55)]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200/70 via-indigo-200/50 to-fuchsia-200/60 dark:from-sky-500/15 dark:via-indigo-500/15 dark:to-fuchsia-500/15" />
          <div className="absolute inset-0 opacity-[0.16] dark:opacity-[0.18]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(15,23,42,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.28) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          {!reduce && (
            <>
              <motion.div
                aria-hidden
                animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sky-400/35 blur-3xl dark:bg-sky-400/12"
              />
              <motion.div
                aria-hidden
                animate={{ y: [0, 12, 0], x: [0, -12, 0] }}
                transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -left-20 bottom-[-70px] h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl dark:bg-fuchsia-400/12"
              />
              <motion.div
                aria-hidden
                animate={{ y: [0, -8, 0], x: [0, -10, 0] }}
                transition={{ duration: 8.8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute left-1/2 top-[-120px] h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-400/24 blur-3xl dark:bg-indigo-400/10"
              />
            </>
          )}

          <div className="relative p-5 sm:p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <SoftChip icon={SlidersHorizontal}>MODERN • 3D • ANIMATED</SoftChip>
              <SoftChip icon={FileText}>PDF EXPORT READY</SoftChip>
            </div>

            <h1 className="mt-3 text-[26px] leading-tight font-black text-slate-950 dark:text-white sm:text-[32px] md:text-[40px]">
              Your{" "}
              {/* ✅ ALWAYS visible: fallback text + gradient only when supported + stroke */}
              <span
                className={cn(
  // ✅ fallback (always visible)
  "text-slate-950 dark:text-white",
  // ✅ gradient only when supported
  "supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent",
  "supports-[background-clip:text]:bg-gradient-to-r",
  // ✅ darker gradient (light bg pe bhi clear)
  "supports-[background-clip:text]:from-sky-900 supports-[background-clip:text]:via-indigo-950 supports-[background-clip:text]:to-fuchsia-900",
  "dark:supports-[background-clip:text]:from-sky-300 dark:supports-[background-clip:text]:via-indigo-300 dark:supports-[background-clip:text]:to-fuchsia-300",
  // ✅ outline + shadow so it never washes out
  "[-webkit-text-stroke:0.8px_rgba(15,23,42,0.35)] dark:[-webkit-text-stroke:0.6px_rgba(255,255,255,0.10)]",
  "drop-shadow-[0_2px_0_rgba(255,255,255,0.95)] dark:drop-shadow-[0_2px_0_rgba(0,0,0,0.65)]"
)}

              >
                Syllabus
              </span>{" "}
              — built with Projects
            </h1>

            <p className="mt-2 max-w-3xl text-[13px] text-slate-800/95 dark:text-white/75 md:text-[14px]">
              3D Printing & Designing, Electronics, Scratch, Robotics, IoT, App Development, C++ and Python —
              <span className="font-semibold"> project-first</span> learning for every track.
            </p>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70 text-slate-700 dark:text-white/60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search syllabus (robotics, python, app, iot...)"
                  className={cn(
                    "w-full rounded-2xl border pl-9 pr-10 py-3 text-[12px] font-semibold outline-none",
                    "border-black/10 bg-white/85 text-slate-950 placeholder:text-slate-500/80",
                    "shadow-sm backdrop-blur focus:ring-2 focus:ring-indigo-400/45",
                    "dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
                  )}
                />
                {query?.length > 0 && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 border border-black/10 bg-white/85 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    aria-label="clear"
                  >
                    <X className="h-3.5 w-3.5 text-slate-800 dark:text-white/80" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterPill active={active === "all"} onClick={() => setActive("all")}>
                  All
                </FilterPill>
                <FilterPill active={active === "core"} onClick={() => setActive("core")}>
                  Core Tech
                </FilterPill>
                <FilterPill active={active === "coding"} onClick={() => setActive("coding")}>
                  Coding
                </FilterPill>
              </div>
            </div>
          </div>
        </motion.div>

        {/* grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, idx) => (
            <TrackCard
              key={t.id}
              track={t}
              index={idx}
              onOpen={setOpenTrack}
              onDownloadTrack={onDownloadTrack}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-[26px] border border-black/10 bg-white/80 p-6 text-center dark:border-white/10 dark:bg-white/10">
            <div className="text-[14px] font-black text-slate-950 dark:text-white">No results</div>
            <div className="mt-1 text-[12px] text-slate-700 dark:text-white/70">
              Try a different keyword (e.g., “robot”, “python”, “app”, “iot”).
            </div>
          </div>
        )}

        {/* bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={cn(
            "mt-6 overflow-hidden rounded-[30px] border",
            "border-black/10 bg-white shadow-[0_22px_80px_rgba(0,0,0,0.12)]",
            "dark:border-white/10 dark:bg-[#0B1020]/70 dark:shadow-[0_22px_80px_rgba(0,0,0,0.55)]"
          )}
        >
          
        </motion.div>
      </div>

      <TrackModal open={!!openTrack} onClose={() => setOpenTrack(null)} track={openTrack} />
    </div>
  );
}
