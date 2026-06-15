import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  Sparkles,
  Plus,
  Video,
  FolderKanban,
  FileText,
  GraduationCap,
  StickyNote,
  School,
  Target,
  CalendarClock,
} from "lucide-react";
import STEAMShortsSection from "../components/STEAMShorts/STEAMShortsSection";

const cn = (...s) => s.filter(Boolean).join(" ");

function ActionCards({ onCourse, onSchoolCourses, onMock, onProject, onManual, onSyllabus, onNote, onReport, onChallenges, onReels, onLeave }) {
  const Card = ({ title, desc, icon: Icon, tone, btnText, onClick }) => (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)] p-4"
      )}
    >
      <div className={cn("pointer-events-none absolute -inset-24 opacity-70 blur-2xl", tone)} />
      <div className="relative flex items-start gap-3">
        <div className="size-12 rounded-2xl grid place-items-center bg-white/8 border border-white/10">
          <Icon className="h-5 w-5 text-white/85" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-white">{title}</p>
          <p className="mt-1 text-[11px] text-white/65 font-semibold leading-relaxed">{desc}</p>

          <button
            type="button"
            onClick={onClick}
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12px] font-black",
              "bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/15 transition"
            )}
          >
            <Plus className="h-4 w-4" />
            {btnText}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
    </motion.div>
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3 w-full">
      <Card title="Create Course" desc="Build modules, lessons, videos & publish to students." icon={BookOpen}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.25),transparent_60%)]"
        btnText="New Course" onClick={onCourse} />
      <Card title="School Active Courses" desc="Assign/publish class-wise (student Home shows this)." icon={School}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.18),transparent_60%)]"
        btnText="Manage" onClick={onSchoolCourses} />
      <Card title="Create MockTest" desc="Make question bank, schedule test & track results." icon={ClipboardList}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.22),transparent_60%)]"
        btnText="New Test" onClick={onMock} />
      <Card title="Upload Project" desc="Project briefs, files, rubrics & submissions." icon={FolderKanban}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.18),transparent_60%)]"
        btnText="Add Project" onClick={onProject} />
      <Card title="Upload Manual" desc="Guides, PDFs, handbooks & reference docs." icon={FileText}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(147,197,253,0.16),transparent_60%)]"
        btnText="Add Manual" onClick={onManual} />
      <Card title="Upload Syllabus" desc="Year plan, chapter mapping & schedule." icon={GraduationCap}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.18),transparent_60%)]"
        btnText="Add Syllabus" onClick={onSyllabus} />
      <Card title="Upload Notes" desc="Notes, worksheets, PDFs & classroom handouts." icon={StickyNote}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.16),transparent_60%)]"
        btnText="Add Notes" onClick={onNote} />
      <Card title="Submit Daily Report" desc="Log school visits, students, and activities." icon={FileText}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(167,139,250,0.2),transparent_60%)]"
        btnText="New Report" onClick={onReport} />
      <Card title="Daily Challenges" desc="Post MCQs & logic puzzles for extra rewards." icon={Target}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(239,68,68,0.2),transparent_60%)]"
        btnText="New Challenge" onClick={onChallenges} />
      <Card title="STEAM Shorts" desc="Post short vertical videos for students." icon={Video}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.2),transparent_60%)]"
        btnText="Post Reel" onClick={onReels} />
      <Card title="Leave Application" desc="Apply for leave and track your status." icon={CalendarClock}
        tone="bg-[radial-gradient(circle_at_30%_30%,rgba(236,72,153,0.18),transparent_60%)]"
        btnText="Apply Leave" onClick={onLeave} />
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Top STEAM Shorts Area */}
      <div className="-mx-3 sm:mx-0">
        <STEAMShortsSection language="en" />
      </div>
      
      {/* Welcome Title */}
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="text-sky-400" /> Educator Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-white/70 font-medium">
          Manage your courses, activities, mock tests, and quick shortcuts from here.
        </p>
      </div>

      {/* Grid Shortcuts */}
      <ActionCards
        onCourse={() => nav("/educator/courses/new")}
        onSchoolCourses={() => nav("/educator/school-courses")}
        onMock={() => nav("/educator/mock-tests/new")}
        onProject={() => nav("/educator/projects/new")}
        onManual={() => nav("/educator/manuals/new")}
        onSyllabus={() => nav("/educator/syllabus/new")}
        onNote={() => nav("/educator/notes/new")}
        onReport={() => nav("/educator/reports/new")}
        onChallenges={() => nav("/educator/challenges")}
        onReels={() => nav("/educator/reels")}
        onLeave={() => nav("/educator/leave")}
      />
    </div>
  );
}
