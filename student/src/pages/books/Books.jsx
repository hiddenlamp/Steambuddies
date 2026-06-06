// src/pages/books/Books.jsx
import React, { useMemo, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Filter,
  X,
  Sparkles,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";

const cn = (...s) => s.filter(Boolean).join(" ");

/** ===================== STATIC BOOKS (NO BACKEND) ===================== */
/**
 * ✅ Put your PDFs in:
 * public/books/<file>.pdf
 * public/books/covers/<img>.jpg (optional)
 *
 * Then use URLs like:
 * pdfUrl: "/books/arduino.pdf"
 * coverUrl: "/books/covers/arduino.jpg"
 */
const STATIC_BOOKS = [
  {
    id: "arduino-basics",
    title: { en: "Arduino Basics", hi: "Arduino बेसिक्स" },
    category: "Robotics",
    description: "Start Arduino from zero: components, pins, code & simple projects.",
    pdfUrl: "/books/arduino_basics.pdf",
    coverUrl: "/books/covers/arduino.jpg",
    tags: ["Arduino", "Beginner", "Projects"],
  },
  {
    id: "iot-101",
    title: { en: "IoT 101", hi: "IoT 101" },
    category: "IoT",
    description: "Sensors, ESP boards, dashboards & real-world IoT use cases.",
    pdfUrl: "/books/iot_101.pdf",
    coverUrl: "/books/covers/iot.jpg",
    tags: ["ESP32", "Sensors", "Dashboard"],
  },
  {
    id: "python-for-students",
    title: { en: "Python for Students", hi: "Students के लिए Python" },
    category: "Coding",
    description: "Core Python + mini programs + practice questions.",
    pdfUrl: "/books/python_for_students.pdf",
    coverUrl: "/books/covers/python.jpg",
    tags: ["Python", "Basics", "Practice"],
  },
  {
    id: "science-fun",
    title: { en: "Fun Science Experiments", hi: "मज़ेदार साइंस एक्सपेरिमेंट्स" },
    category: "Science",
    description: "Safe and easy experiments with explanations & learning points.",
    pdfUrl: "/books/fun_science.pdf",
    coverUrl: "/books/covers/science.jpg",
    tags: ["Experiments", "STEM", "Hands-on"],
  },
  {
    id: "math-shortcuts",
    title: { en: "Math Shortcuts", hi: "Math शॉर्टकट्स" },
    category: "Math",
    description: "Quick tricks & practice for speed calculation.",
    pdfUrl: "/books/math_shortcuts.pdf",
    coverUrl: "/books/covers/math.jpg",
    tags: ["Speed", "Tricks", "Practice"],
  },
];

/** ====== CATEGORY STYLES ====== */
const CATEGORY_META = {
  Science: { id: "science", gradient: "from-sky-400 via-indigo-500 to-fuchsia-500" },
  Robotics: { id: "robotics", gradient: "from-violet-500 via-indigo-500 to-sky-500" },
  IoT: { id: "iot", gradient: "from-emerald-400 via-cyan-500 to-sky-500" },
  Coding: { id: "coding", gradient: "from-amber-400 via-orange-500 to-rose-500" },
  Math: { id: "math", gradient: "from-lime-400 via-emerald-500 to-cyan-500" },
};

function categoryId(name = "") {
  return CATEGORY_META[name]?.id ?? String(name).toLowerCase().replace(/\s+/g, "_");
}

/** ===================== UI PIECES ===================== */
function Kicker({ label }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "text-[10px] font-extrabold tracking-[0.18em]",
        "bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10",
        "text-slate-900/70 dark:text-white/80"
      )}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <Sparkles className="w-3.5 h-3.5 opacity-80" />
      <span>{label}</span>
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border backdrop-blur-md",
        active
          ? "bg-white text-slate-950 border-white shadow-[0_18px_60px_rgba(0,0,0,0.25)] dark:bg-white dark:text-slate-950"
          : "bg-white/60 text-slate-800 border-black/10 hover:bg-white dark:bg-white/[0.06] dark:text-white/85 dark:border-white/12 dark:hover:bg-white/[0.09]"
      )}
    >
      {children}
    </button>
  );
}

function BookCover({ coverUrl, title, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/12 bg-black/5 dark:bg-white/10">
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-70", gradient)} />

      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="relative w-full h-[170px] sm:h-[185px] object-cover opacity-90"
          loading="lazy"
        />
      ) : (
        <div className="relative h-[170px] sm:h-[185px] grid place-items-center">
          <div className="flex items-center gap-2 text-white/90 font-extrabold">
            <FileText className="w-5 h-5" />
            <span className="text-sm">PDF</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="text-xs font-extrabold text-white/95 line-clamp-1">{title}</div>
        <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-white/12 border border-white/15 text-white/90">
          <BookOpen className="w-3.5 h-3.5" />
          READ
        </div>
      </div>
    </div>
  );
}

function BookCard({ b, lang, onRead, onDownload }) {
  const title = b.title?.[lang] ?? b.title?.en ?? "Untitled";
  const grad = CATEGORY_META[b.category]?.gradient ?? "from-sky-400 via-indigo-500 to-fuchsia-500";

  return (
    <motion.div
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "group relative rounded-[26px] overflow-hidden",
        "border border-black/10 dark:border-white/12",
        "shadow-[0_26px_80px_rgba(0,0,0,0.20)]",
        "bg-white/75 dark:bg-[#0B1020]/70 backdrop-blur-xl",
        "will-change-transform"
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={cn("pointer-events-none absolute -inset-24 opacity-60 blur-2xl bg-gradient-to-r", grad)} />

      <div className="relative p-5">
        <BookCover coverUrl={b.coverUrl} title={title} gradient={grad} />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-slate-900 dark:text-white line-clamp-1">
              {title}
            </div>

            <div className="mt-0.5 text-[11px] text-slate-600 dark:text-white/70 line-clamp-1">
              {lang === "hi" ? "श्रेणी:" : "Category:"}{" "}
              <span className="font-bold">{b.category}</span>
            </div>

            {b.description ? (
              <div className="mt-2 text-[12px] text-slate-700/80 dark:text-white/70 line-clamp-2">
                {b.description}
              </div>
            ) : null}
          </div>

          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide border border-black/10 dark:border-white/12 bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/75">
            PDF
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onRead}
            className={cn(
              "rounded-2xl px-4 py-3 font-extrabold text-sm",
              "bg-slate-950 text-white hover:opacity-95 active:scale-[0.99] transition-all",
              "dark:bg-white dark:text-slate-950",
              "shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
            )}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              {lang === "hi" ? "रीड" : "Read"}
            </span>
          </button>

          <button
            onClick={onDownload}
            className={cn(
              "rounded-2xl px-4 py-3 font-extrabold text-sm",
              "bg-white/70 dark:bg-white/[0.10] border border-black/10 dark:border-white/12",
              "text-slate-900 dark:text-white hover:bg-white active:scale-[0.99] transition-all",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              {lang === "hi" ? "डाउनलोड" : "Download"}
            </span>
          </button>
        </div>

        {(b.tags || []).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {(b.tags || []).slice(0, 5).map((t, i) => (
              <span
                key={i}
                className="text-[11px] font-extrabold px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/12 text-slate-700 dark:text-white/75"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/8 to-transparent dark:from-white/8" />
    </motion.div>
  );
}

/** ====== PDF READER MODAL ====== */
function PdfReaderModal({ open, onClose, book, lang }) {
  if (!open || !book) return null;

  const title = book.title?.[lang] ?? book.title?.en ?? "Untitled";
  const url = book.pdfUrl;
  const grad = CATEGORY_META[book.category]?.gradient ?? "from-sky-400 via-indigo-500 to-fuchsia-500";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.button
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className={cn(
            "relative w-full max-w-6xl",
            "max-h-[90vh] overflow-hidden",
            "rounded-[26px] sm:rounded-[32px]",
            "border border-white/12 bg-[#0B1020]/90 backdrop-blur-2xl",
            "shadow-[0_30px_120px_rgba(0,0,0,0.60)]"
          )}
        >
          <div className={cn("absolute -inset-24 opacity-55 blur-2xl bg-gradient-to-r", grad)} />

          <div className="relative p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-white line-clamp-2">{title}</div>
                <div className="mt-1 text-sm text-white/70">
                  {lang === "hi" ? "PDF रीडर" : "PDF Reader"} • {book.category}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {url ? (
                  <>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                        "bg-white text-slate-950 hover:opacity-95 transition"
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {lang === "hi" ? "ओपन" : "Open"}
                    </a>

                    <a
                      href={url}
                      download
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                        "bg-white/10 border border-white/12 text-white/90 hover:bg-white/15 transition"
                      )}
                    >
                      <Download className="w-4 h-4" />
                      {lang === "hi" ? "डाउनलोड" : "Download"}
                    </a>
                  </>
                ) : null}

                <button
                  onClick={onClose}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-extrabold",
                    "bg-white/10 border border-white/12 text-white/90 hover:bg-white/15 transition"
                  )}
                >
                  <X className="w-4 h-4" />
                  {lang === "hi" ? "बंद" : "Close"}
                </button>
              </div>
            </div>
          </div>

          <div className="relative bg-black/30">
            {!url ? (
              <div className="h-[60vh] grid place-items-center text-white/70 font-extrabold">
                {lang === "hi" ? "PDF लिंक नहीं मिला" : "PDF link not found"}
              </div>
            ) : (
              <iframe title={title} src={`${url}#view=FitH`} className="w-full h-[78vh]" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** ===================== MAIN PAGE (STATIC) ===================== */
export default function Books() {
  const nav = useNavigate();
  const { theme } = useContext(ThemeContext) || { theme: "dark" };
  const { language } = useContext(LanguageContext) || { language: "en" };
  const lang = language || "en";

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [openId, setOpenId] = useState(null);

  const allBooks = STATIC_BOOKS;

  const categories = useMemo(() => {
    const seen = new Set(allBooks.map((b) => b.category).filter(Boolean));
    const preferred = ["Science", "Robotics", "IoT", "Coding", "Math"];
    const ordered = preferred.filter((x) => seen.has(x)).concat(Array.from(seen).filter((x) => !preferred.includes(x)));
    return ordered.map((name) => ({ name, id: categoryId(name) }));
  }, [allBooks]);

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allBooks;

    if (active !== "all") {
      list = list.filter((b) => categoryId(b.category) === active);
    }

    if (q) {
      list = list.filter((b) => {
        const tEn = (b.title?.en ?? "").toLowerCase();
        const tHi = (b.title?.hi ?? "").toLowerCase();
        const cat = (b.category ?? "").toLowerCase();
        const desc = (b.description ?? "").toLowerCase();
        const tags = (b.tags || []).join(" ").toLowerCase();
        return tEn.includes(q) || tHi.includes(q) || cat.includes(q) || desc.includes(q) || tags.includes(q);
      });
    }

    return list;
  }, [query, active, allBooks]);

  const openBook = useMemo(() => allBooks.find((x) => x.id === openId), [openId, allBooks]);

  const onDownload = (b) => {
    if (!b?.pdfUrl) return;
    // static: open in new tab (download works if browser/server allows)
    window.open(b.pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      {/* background */}
      <div
        className={cn(
          "absolute inset-0",
          theme === "dark"
            ? "bg-[#070A12]"
            : "bg-[radial-gradient(1100px_500px_at_15%_10%,rgba(56,189,248,0.30),transparent_55%),radial-gradient(900px_480px_at_85%_15%,rgba(168,85,247,0.25),transparent_60%),radial-gradient(900px_520px_at_50%_90%,rgba(34,197,94,0.18),transparent_60%),linear-gradient(180deg,#F8FBFF,#FFFFFF)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-60 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto custom-scroll w-full pb-20 md:pb-0 md:pl-24 md:pr-6">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-8 md:py-10">
        {/* Back */}
        <div className="mb-4 flex items-center justify-start">
          <button
            type="button"
            onClick={() => nav(-1)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-black",
              "bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl",
              "border border-black/10 dark:border-white/12",
              "text-slate-900 dark:text-white/90 hover:opacity-95 transition",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "hi" ? "वापस" : "Back"}
          </button>
        </div>

        {/* Header */}
        <div className="text-center">
          <Kicker label={lang === "hi" ? "डिजिटल बुक्स" : "DIGITAL BOOKS"} />

          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-[1.12] tracking-tight text-slate-950 dark:text-white">
            {lang === "hi" ? (
              <span className="inline">
                आपकी{" "}
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  बुक लाइब्रेरी
                </span>{" "}
                — PDF रीडर के साथ
              </span>
            ) : (
              <span className="inline">
                Your{" "}
                <span
                  className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  Book Library
                </span>{" "}
                — Read & Download PDFs
              </span>
            )}
          </h2>

          <p className="mt-3 mx-auto max-w-2xl text-[13px] sm:text-sm text-slate-700/80 dark:text-white/80">
            {lang === "hi"
              ? "यहाँ आपकी static PDF किताबें दिखेंगी — सर्च करें, पढ़ें और डाउनलोड करें।"
              : "Your static PDF books are shown here — search, read, and download."}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl px-3 py-2",
              "bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl",
              "border border-black/10 dark:border-white/12",
              "shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            )}
          >
            <Search className="w-4 h-4 text-slate-700 dark:text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "hi" ? "बुक / टैग / श्रेणी खोजें..." : "Search book / tags / category..."}
              className={cn(
                "w-full md:w-[380px] bg-transparent outline-none",
                "text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/45"
              )}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.18em] text-slate-700 dark:text-white/70">
              <Filter className="w-4 h-4" />
              {lang === "hi" ? "फ़िल्टर" : "FILTER"}
            </span>

            <Chip active={active === "all"} onClick={() => setActive("all")}>
              {lang === "hi" ? "सभी" : "All"}
            </Chip>

            {categories.map((c) => (
              <Chip key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {books.map((b) => (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
              >
                <BookCard b={b} lang={lang} onRead={() => setOpenId(b.id)} onDownload={() => onDownload(b)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {books.length === 0 && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] border border-black/10 dark:border-white/12">
              <Sparkles className="w-4 h-4 text-slate-800 dark:text-white/70" />
              <div className="text-sm font-extrabold text-slate-800 dark:text-white/80">
                {lang === "hi" ? "कोई बुक नहीं मिली" : "No books found"}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <PdfReaderModal open={!!openId} onClose={() => setOpenId(null)} book={openBook} lang={lang} />
    </div>
  );
}
