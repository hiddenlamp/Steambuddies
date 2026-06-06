// src/components/navigation/Navigation.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Brain, User2, Sparkles } from "lucide-react";

const tabs = [
  { 
    label: "Home", 
    labelHi: "होम",
    icon: Home, 
    path: "/home", 
    accent: "from-cyan-400 via-sky-500 to-blue-600", 
    glow: "rgba(6,182,212,0.4)" 
  },
  { 
    label: "Courses", 
    labelHi: "कोर्स",
    icon: BookOpen, 
    path: "/courses", 
    accent: "from-indigo-400 via-purple-500 to-fuchsia-600", 
    glow: "rgba(99,102,241,0.4)" 
  },
  { 
    label: "Mock Test", 
    labelHi: "मॉक टेस्ट",
    icon: Brain, 
    path: "/mock-tests", 
    accent: "from-amber-400 via-orange-500 to-rose-500", 
    glow: "rgba(245,158,11,0.4)" 
  },
  { 
    label: "Profile", 
    labelHi: "प्रोफ़ाइल",
    icon: User2, 
    path: "/profile", 
    accent: "from-emerald-400 via-teal-500 to-cyan-600", 
    glow: "rgba(16,185,129,0.4)" 
  },
];

function MobileBottomNav({ nav, activePath }) {
  const isTabActive = (tabPath) => {
    if (tabPath === "/home") return activePath === "/home";
    return activePath.startsWith(tabPath);
  };

  const getLanguage = () => {
    try {
      return localStorage.getItem("lang") || "en";
    } catch {
      return "en";
    }
  };
  const lang = getLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none pb-4 px-4">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <div className="relative rounded-[28px] p-[1.5px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          {/* Neon border glow gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-indigo-500/20 to-emerald-500/30 blur-md" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-purple-500/30 to-emerald-400/40" />

          {/* Dock Body */}
          <div className="
            relative rounded-[26px] backdrop-blur-2xl px-3 py-2 flex items-center justify-around
            bg-white/75 border border-white/40
            dark:bg-slate-950/65 dark:border-white/10
          ">
            {/* Subtle background noise / lines */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none dark:opacity-[0.06]"
              style={{
                backgroundImage: "radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)",
                backgroundSize: "16px 16px"
              }}
            />

            {tabs.map((t) => {
              const active = isTabActive(t.path);
              const Icon = t.icon;

              return (
                <button
                  key={t.label}
                  onClick={() => nav(t.path)}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[70px] outline-none"
                  aria-label={t.label}
                >
                  {/* Sliding glass capsule background */}
                  {active && (
                    <motion.div
                      layoutId="mobile-active-capsule"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-[20px] bg-slate-950/5 dark:bg-white/10 border border-black/5 dark:border-white/10"
                      style={{
                        boxShadow: `0 8px 24px ${t.glow}`,
                      }}
                    />
                  )}

                  {/* Icon wrapper */}
                  <motion.div
                    animate={active ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`
                      relative w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all duration-300
                      ${active 
                        ? `bg-gradient-to-br ${t.accent} text-white border-transparent shadow-lg` 
                        : "bg-transparent text-slate-500 border-transparent dark:text-slate-400"
                      }
                    `}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    
                    {/* Glowing active point dot */}
                    {active && (
                      <motion.span 
                        layoutId="active-dot-glow"
                        className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#fff]" 
                      />
                    )}
                  </motion.div>

                  <span className={`
                    text-[9px] font-bold mt-1.5 transition-all duration-300 tracking-wide
                    ${active 
                      ? "text-slate-950 dark:text-white scale-105" 
                      : "text-slate-500 dark:text-slate-400"
                    }
                  `}>
                    {lang === "hi" ? t.labelHi : t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function DesktopSideNav({ nav, activePath }) {
  const isTabActive = (tPath) => {
    if (tPath === "/home") return activePath === "/home";
    return activePath.startsWith(tPath);
  };

  const getLanguage = () => {
    try {
      return localStorage.getItem("lang") || "en";
    } catch {
      return "en";
    }
  };
  const lang = getLanguage();

  return (
    <nav className="hidden md:flex fixed left-5 top-0 bottom-0 z-40 items-center pointer-events-none">
      <div className="pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="relative h-[80vh] w-[88px] rounded-[32px] p-[1.5px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
        >
          {/* Cosmic background glows */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-emerald-500/20 blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/30 via-indigo-500/20 to-purple-500/30" />

          {/* Sidebar Body */}
          <div className="
            relative h-full rounded-[30px] backdrop-blur-2xl px-2 py-6 flex flex-col items-center justify-between
            bg-white/80 border border-white/40
            dark:bg-slate-950/65 dark:border-white/10
          ">
            {/* Top brand logo or sparkle */}
            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-md flex items-center justify-center text-white">
              <Sparkles size={20} className="animate-pulse" />
            </div>

            {/* Middle Nav Icons */}
            <div className="flex-1 flex flex-col justify-center gap-5 w-full">
              {tabs.map((t) => {
                const active = isTabActive(t.path);
                const Icon = t.icon;

                return (
                  <button
                    key={t.label}
                    onClick={() => nav(t.path)}
                    className="group relative flex flex-col items-center justify-center py-2 w-full outline-none"
                    aria-label={t.label}
                  >
                    {/* Active backdrop pill */}
                    {active && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="absolute inset-x-2 inset-y-0.5 rounded-[22px] bg-slate-950/5 dark:bg-white/10 border border-black/5 dark:border-white/10"
                        style={{
                          boxShadow: `0 10px 25px ${t.glow}`,
                        }}
                      />
                    )}

                    {/* Active vertical accent bar */}
                    {active && (
                      <motion.span
                        layoutId="desktop-active-bar"
                        className={`absolute left-0 w-1 h-9 rounded-r-full bg-gradient-to-b ${t.accent}`}
                      />
                    )}

                    {/* Icon card */}
                    <div className="relative">
                      {/* Glow hover circle */}
                      <div className={`absolute -inset-1.5 rounded-[16px] blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-300 bg-gradient-to-br ${t.accent}`} />
                      
                      <motion.div
                        whileHover={{ y: -3, scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          relative w-12 h-12 rounded-[16px] flex items-center justify-center border transition-all duration-300
                          ${active 
                            ? `bg-gradient-to-br ${t.accent} text-white border-transparent shadow-lg` 
                            : "bg-black/5 text-slate-600 border-black/5 dark:bg-white/5 dark:text-slate-400 dark:border-white/5 dark:group-hover:text-white dark:group-hover:border-white/10"
                          }
                        `}
                      >
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                      </motion.div>
                    </div>

                    <span className={`
                      text-[9px] font-bold mt-1.5 transition-all duration-300 tracking-wide
                      ${active 
                        ? "text-slate-950 dark:text-white scale-105" 
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                      }
                    `}>
                      {lang === "hi" ? t.labelHi : t.label}
                    </span>

                    {/* Floating Side Tooltip */}
                    <div className="absolute left-[80px] scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 pointer-events-none origin-left z-50">
                      <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white bg-slate-950/90 border border-white/10 shadow-lg whitespace-nowrap">
                        {lang === "hi" ? t.labelHi : t.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom status indicator or settings dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </div>
        </motion.div>
      </div>
    </nav>
  );
}

export default function Navigation() {
  const location = useLocation();
  const nav = useNavigate();
  const activePath = location.pathname;

  return (
    <>
      <MobileBottomNav nav={nav} activePath={activePath} />
      <DesktopSideNav nav={nav} activePath={activePath} />
    </>
  );
}
