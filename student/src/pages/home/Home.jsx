// src/pages/home/Home.jsx
import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { 
  Sparkles, 
  BookOpen, 
  Brain, 
  User2, 
  Settings, 
  LogOut, 
  Globe, 
  Moon, 
  Sun, 
  ArrowRight, 
  Calendar, 
  Compass, 
  ShieldAlert, 
  Layers,
  ChevronRight,
  Search,
  Activity,
  Award,
  Atom,
  Eye,
  Target,
  MessageCircle,
  Wrench,
  Box,
  Gamepad2,
  Bot,
  Zap
} from "lucide-react";
import NotificationBell from "../../components/shared/NotificationBell";
import STEAMShortsSection from "../../components/STEAMShorts/STEAMShortsSection";
import DailyChallengeCard from "../../components/Challenges/DailyChallengeCard";
import { API_BASE_URL } from "../../utils/data";

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useContext(ThemeContext);

  const currentUser = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return {
        name: u?.fullName || u?.name || "Student",
        role: u?.role,
        email: u?.email,
      };
    } catch {
      return { name: "Student" };
    }
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("lang") || "en";
    } catch {
      return "en";
    }
  });
  

  const changeLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem("lang", lang);
      // reload page or trigger state update for Navigation sync
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}
  };

  const firstLetter = currentUser?.name?.[0]?.toUpperCase() || "S";
  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  const [events, setEvents] = useState([]);

  // ===== Gamification State & Sync Logic =====
  const [gamification, setGamification] = useState(() => {
    try {
      const saved = localStorage.getItem("steam_gamification");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      level: 1,
      xp: 120,
      maxXp: 200,
      coins: 50,
      badges: ["Welcome Explorer"]
    };
  });

  const saveGamification = (updated) => {
    setGamification(updated);
    try {
      localStorage.setItem("steam_gamification", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}
  };

  const [levelUpMsg, setLevelUpMsg] = useState(null);
  const [rewardPopup, setRewardPopup] = useState(null);

  const awardReward = (xpAmt, coinsAmt, newBadge = null) => {
    let nextXp = gamification.xp + xpAmt;
    let nextLevel = gamification.level;
    let nextMaxXp = gamification.maxXp;
    let leveledUp = false;

    while (nextXp >= nextMaxXp) {
      nextXp -= nextMaxXp;
      nextLevel += 1;
      nextMaxXp = nextLevel * 200;
      leveledUp = true;
    }

    const updatedBadges = [...gamification.badges];
    if (newBadge && !updatedBadges.includes(newBadge)) {
      updatedBadges.push(newBadge);
    }

    // Auto unlock level badges
    if (nextLevel >= 3 && !updatedBadges.includes("Science Prodigy")) {
      updatedBadges.push("Science Prodigy");
    }
    if (nextLevel >= 5 && !updatedBadges.includes("STEAM Champ")) {
      updatedBadges.push("STEAM Champ");
    }

    saveGamification({
      level: nextLevel,
      xp: nextXp,
      maxXp: nextMaxXp,
      coins: gamification.coins + coinsAmt,
      badges: updatedBadges
    });

    if (leveledUp) {
      setLevelUpMsg(nextLevel);
    }
  };

  // Sync state between tabs
  useEffect(() => {
    const handleSync = (e) => {
      if (e.key === "steam_gamification") {
        try {
          setGamification(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  // ===== STEAMbuddy AI Mascot State & Logic =====
  const [mascotOpen, setMascotOpen] = useState(false);
  const [mascotMsg, setMascotMsg] = useState(() => {
    return language === "en" 
      ? "Hello explorer! I am STEAMbuddy AI. Click one of the options below to speak science facts, study tips, or motivation!" 
      : "नमस्ते एक्सप्लोरर! मैं स्टीमबडी एआई हूँ। विज्ञान तथ्य, अध्ययन टिप्स या प्रेरणा सुनने के लिए नीचे दिए गए बटन पर टैप करें!";
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const triggerMascotResponse = (type) => {
    const data = {
      en: {
        fact: [
          "Did you know that water expands when it freezes, unlike most other substances?",
          "Space is completely silent because there is no atmosphere for sound waves to travel through.",
          "Light travels from the Sun to the Earth in about 8 minutes and 20 seconds!",
          "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still edible."
        ],
        motivation: [
          "Keep building, explorer! Every mistake is a step closer to solving the puzzle.",
          "Curiosity is the engine of achievement. Ask questions and learn something new today!"
        ],
        tip: [
          "Try explaining what you learned to a friend. It helps lock the concepts in your brain!",
          "Take a 5-minute break after every 25 minutes of coding to keep your mind fresh."
        ]
      },
      hi: {
        fact: [
          "क्या आप जानते हैं कि अधिकांश अन्य पदार्थों के विपरीत, पानी जमने पर फैलता है?",
          "अंतरिक्ष पूरी तरह से शांत है क्योंकि वहां ध्वनि तरंगों के यात्रा करने के लिए कोई वातावरण नहीं है।",
          "सूर्य से प्रकाश को पृथ्वी तक पहुँचने में लगभग 8 मिनट और 20 सेकंड लगते हैं!",
          "शहद कभी खराब नहीं होता। पुरातत्वविदों को प्राचीन मिस्र के मकबरों में 3000 साल पुराना शहद मिला है जो आज भी खाने योग्य है।"
        ],
        motivation: [
          "खोज जारी रखें, एक्सप्लोरर! हर गलती पहेली को सुलझाने के करीब एक कदम है।",
          "जिज्ञासा सफलता का इंजन है। आज कुछ नया सीखें और प्रश्न पूछें!"
        ],
        tip: [
          "जो आपने सीखा है उसे किसी दोस्त को समझाने की कोशिश करें। इससे कॉन्सेप्ट दिमाग में बैठ जाता है!",
          "अपने दिमाग को तरोताजा रखने के लिए कोडिंग के हर 25 मिनट के बाद 5 मिनट का ब्रेक लें।"
        ]
      }
    };

    const choices = data[language][type];
    const picked = choices[Math.floor(Math.random() * choices.length)];
    setMascotMsg(picked);
    
    // Speak using Web Speech API
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(picked);
      const targetLang = language === "hi" ? "hi-IN" : "en-US";
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(targetLang));
      if (voice) utterance.voice = voice;
      utterance.lang = targetLang;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copy = {
    en: {
      dashboardLabel: "FUTURISTIC STEAM PORTAL",
      welcomeBack: "Welcome back, explorer",
      highlightsTitle: "Immersive Learning Worlds",
      quickAccessTitle: "Jump into",
      recommendedTitle: "Fun STEM courses",
      upcomingTitle: "Upcoming Quizzes & Events",
      viewAll: "View all",
      seeCalendar: "View Calendar",
      activeCoursesTitle: "Active School Courses",
      activeCoursesSub: "Track your real-time class milestones & completion.",
    },
    hi: {
      dashboardLabel: "फ्यूचरिस्टिक STEAM पोर्टल",
      welcomeBack: "वापस स्वागत है, एक्सप्लोरर",
      highlightsTitle: "इमर्सिव लर्निंग वर्ल्ड्स",
      quickAccessTitle: "सीधे शुरू करें",
      recommendedTitle: "मज़ेदार STEM कोर्स",
      upcomingTitle: "आगामी क्विज़ व इवेंट्स",
      viewAll: "सब देखें",
      seeCalendar: "कैलेंडर देखें",
      activeCoursesTitle: "आपके स्कूल में चालू कोर्स",
      activeCoursesSub: "चल रहे कोर्स और अपनी प्रोग्रेस लाइव देखें।",
    },
  };

  const t = copy[language];

  const pickLang = (v, fallback = "") => {
    if (!v) return fallback;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object" && !Array.isArray(v)) {
      const x = v?.[language] ?? v?.en ?? v?.hi;
      if (typeof x === "string" || typeof x === "number") return String(x);
    }
    return fallback;
  };



  const quickActions = [
    {
      key: "study",
      icon: "📘",
      path: "/syllabus",
      label: { en: "Syllabus", hi: "सिलेबस" },
    },
    {
      key: "notes",
      icon: "📝",
      path: "/notes",
      label: { en: "Notes", hi: "नोट्स" },
    },
    {
      key: "tests",
      icon: "🧠",
      path: "/mock-tests",
      label: { en: "Mock tests", hi: "मॉक टेस्ट" },
    },
    {
      key: "projects",
      icon: "🧩",
      path: "/projects",
      label: { en: "Projects", hi: "प्रोजेक्ट्स" },
    },
    {
      key: "books",
      icon: "📚",
      path: "/books",
      label: { en: "Books", hi: "किताबें" },
    },
    {
      key: "manuals",
      icon: "🧾",
      path: "/manuals",
      label: { en: "Manuals", hi: "मैनुअल्स" },
    },
  ];

  // ===== Active School Courses (API) =====
  const [token, setToken] = useState(() => (localStorage.getItem("accessToken") || "").trim());

  const [todayChallenges, setTodayChallenges] = useState([]);
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(null);
  const selectedChallenge = selectedChallengeIndex !== null ? todayChallenges[selectedChallengeIndex] : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/challenges/today`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTodayChallenges(data.challenges);
      })
      .catch(err => console.error("Error fetching challenges:", err));
  }, [token]);

  const handleAttemptSuccess = (xp, coins) => {
    awardReward(xp, coins, "Daily Challenger");
    setRewardPopup({
      xp: xp,
      coins: coins,
      badge: "Daily Challenger",
      message: language === "en" ? "Correct Answer! Rewards Added!" : "सही जवाब! पुरस्कार जोड़े गए!"
    });
  };
  const [activeSchoolCourses, setActiveSchoolCourses] = useState([]);
  const [loadingSchoolCourses, setLoadingSchoolCourses] = useState(false);
  const [schoolCoursesError, setSchoolCoursesError] = useState("");

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

  useEffect(() => {
    if (!token) {
      setActiveSchoolCourses([]);
      setSchoolCoursesError("");
      setLoadingSchoolCourses(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingSchoolCourses(true);
        setSchoolCoursesError("");

        const cleanToken = String(token).trim().replace(/^"+|"+$/g, "");

        const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "https://steambuddies.onrender.com";
        const API_BASE = String(RAW_BASE).replace(/\/+$/, "");
        const res = await fetch(`${API_BASE}/api/student/my-active-courses`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${cleanToken}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || `Failed to fetch (${res.status})`);
        }

        const raw = Array.isArray(data?.items) ? data.items : [];

        const list = raw
          .map((a) => {
            const id = String(a?.assignmentId || a?.id || a?._id || "");
            const courseId = String(a?.courseId || "");
            if (!id || !courseId) return null;

            const completedLessons = Number(a?.completedLessons || 0);
            const totalLessons = Math.max(1, Number(a?.totalLessons || 1));
            const computedPct = (completedLessons / totalLessons) * 100;
            const progressPct = Math.max(0, Math.min(100, Number(a?.progressPct ?? computedPct)));

            return {
              id,
              assignmentId: id,
              courseId,
              title: a?.title || "Untitled Course",
              sub: a?.sub || "Lessons • Activities • Projects • Assessments",
              categoryLabel: a?.categoryLabel || "Course",
              categoryEmoji: a?.categoryEmoji || "✨",
              emoji: a?.emoji || "📚",
              status: String(a?.status || "active").toLowerCase(),
              progressPct,
              completedLessons,
              totalLessons,
              lastUpdated: a?.lastUpdated || null,
            };
          })
          .filter(Boolean);

        setActiveSchoolCourses(list);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setSchoolCoursesError(e?.message || "Something went wrong");
        setActiveSchoolCourses([]);
      } finally {
        setLoadingSchoolCourses(false);
      }
    })();

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events/public`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setEvents(data.events);
        }
      })
      .catch(err => console.error("Failed to fetch events:", err));
  }, []);

  const goQuest = () => nav("/quest");

  // Custom 3D Tilt calculation
  const handle3DTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 2; // -1 to 1
    const py = (y / rect.height - 0.5) * 2; // -1 to 1
    card.style.setProperty("--rx", `${-py * 12}deg`);
    card.style.setProperty("--ry", `${px * 12}deg`);
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  };

  const reset3DTilt = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", `0deg`);
    card.style.setProperty("--ry", `0deg`);
  };

  const handleStartChallenge = (e) => {
    e.stopPropagation();
    awardReward(40, 15, "Daily Challenger");
    setRewardPopup({
      xp: 40,
      coins: 15,
      badge: "Daily Challenger",
      message: language === "en" ? "Daily Challenge Claimed! Rewards Added!" : "दैनिक चुनौती दावा! पुरस्कार जोड़े गए!"
    });
    setTimeout(() => {
      nav("/quest");
    }, 1500);
  };

  const handleSolarSystemClick = () => {
    const updatedBadges = [...gamification.badges];
    let unlocked = false;
    if (!updatedBadges.includes("Star Astronomer")) {
      updatedBadges.push("Star Astronomer");
      unlocked = true;
    }
    if (unlocked) {
      saveGamification({
        ...gamification,
        badges: updatedBadges
      });
      setRewardPopup({
        xp: 20,
        coins: 5,
        badge: "Star Astronomer",
        message: language === "en" ? "Astronomy Lab Unlocked! Badge Unlocked!" : "खगोल विज्ञान लैब अनलॉक! बैज अनलॉक!"
      });
    }
    nav("/solar-system");
  };

  const handleHumanBodyClick = () => {
    const updatedBadges = [...gamification.badges];
    let unlocked = false;
    if (!updatedBadges.includes("Physiologist")) {
      updatedBadges.push("Physiologist");
      unlocked = true;
    }
    if (unlocked) {
      saveGamification({
        ...gamification,
        badges: updatedBadges
      });
      setRewardPopup({
        xp: 20,
        coins: 5,
        badge: "Physiologist",
        message: language === "en" ? "Anatomy Lab Unlocked! Badge Unlocked!" : "शारीरिक विज्ञान लैब अनलॉक! बैज अनलॉक!"
      });
    }
    nav("/human-body");
  };

  const handleRoboticsClick = () => {
    const updatedBadges = [...gamification.badges];
    let unlocked = false;
    if (!updatedBadges.includes("Robotics Engineer")) {
      updatedBadges.push("Robotics Engineer");
      unlocked = true;
    }
    if (unlocked) {
      saveGamification({
        ...gamification,
        badges: updatedBadges
      });
      setRewardPopup({
        xp: 20,
        coins: 5,
        badge: "Robotics Engineer",
        message: language === "en" ? "Robotics Lab Unlocked! Badge Unlocked!" : "रोबोटिक्स लैब अनलॉक! बैज अनलॉक!"
      });
    }
    nav("/robotics-lab");
  };

  const handleMoleculesClick = () => {
    const updatedBadges = [...gamification.badges];
    let unlocked = false;
    if (!updatedBadges.includes("Molecular Chemist")) {
      updatedBadges.push("Molecular Chemist");
      unlocked = true;
    }
    if (unlocked) {
      saveGamification({
        ...gamification,
        badges: updatedBadges
      });
      setRewardPopup({
        xp: 20,
        coins: 5,
        badge: "Molecular Chemist",
        message: language === "en" ? "Chemistry Lab Unlocked! Badge Unlocked!" : "रसायन विज्ञान लैब अनलॉक! बैज अनलॉक!"
      });
    }
    nav("/molecules-lab");
  };

  return (
    <div className="relative min-h-screen bg-[#f4f7fb] dark:bg-[#030008] text-slate-900 dark:text-slate-50 transition-colors duration-500 pb-24 md:pb-8 md:pl-28 md:pr-8 z-0">
      {/* Light mode global elegant gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(224,242,254,0.5),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(23edea,0.2),transparent_40%)] dark:hidden pointer-events-none -z-10" />
      
      {/* ================= BACKGROUND GLOW ORBS (3D FLOATING FEEL) ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated background mesh pattern */}
        <div className="absolute inset-0 bg-grid-mesh opacity-80" />

        {/* Ambient floating blurred spheres */}
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-cyan-400/30 dark:bg-cyan-500/10 blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 50, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/30 dark:bg-purple-600/8 blur-[150px]"
        />
        <motion.div
          animate={{
            x: [0, 30, -30, 0],
            y: [0, 60, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[5%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/25 dark:bg-emerald-500/8 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, -40, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[75%] right-[25%] w-[38vw] h-[38vw] rounded-full bg-rose-400/25 dark:bg-rose-500/8 blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-0 py-6 space-y-8">
        
        {/* ================= HEADER CONTROL BAR ================= */}
        <motion.header 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {/* Settings trigger */}
            <motion.button
              onClick={() => setMenuOpen((p) => !p)}
              whileHover={{ scale: 1.05, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="
                w-12 h-12 rounded-2xl flex items-center justify-center
                bg-white/80 border border-slate-200/80
                dark:bg-slate-900/50 dark:border-white/10
                shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                backdrop-blur-md text-slate-700 dark:text-slate-200
              "
              aria-label="Open settings panel"
            >
              <Settings size={22} className="animate-spin-slow" />
            </motion.button>

            <div>
              <div className="
                inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest
                bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300
              ">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                {t.dashboardLabel}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Learn • Build • Play • Innovate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell language={language} />

            {/* Quick theme Switcher */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="
                w-11 h-11 rounded-2xl flex items-center justify-center
                bg-white/80 border border-slate-200/80
                dark:bg-slate-900/50 dark:border-white/10
                shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                backdrop-blur-md text-slate-700 dark:text-slate-200
              "
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
            </motion.button>

            {/* Profile badge click to settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav("/profile")}
              className="
                relative w-12 h-12 rounded-2xl flex items-center justify-center
                bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white font-black text-lg
                shadow-[0_10px_25px_rgba(6,182,212,0.25)]
              "
            >
              {firstLetter}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950" />
            </motion.button>
          </div>
        </motion.header>

        {/* ================= SETTINGS DRAWER MENU ================= */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 25 }}
                className="
                  absolute left-4 right-4 md:left-28 md:right-auto md:w-80 top-24 z-50 p-5 space-y-4 rounded-3xl
                  bg-white/90 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.15)] backdrop-blur-2xl
                  dark:bg-slate-950/85 dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)]
                "
              >
                {/* Background ambient details inside menu */}
                <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />

                <div className="relative flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-500" />
                    Quick Customizer
                  </span>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMenuOpen(false)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                  >
                    Close
                  </motion.button>
                </div>

                {/* Dark/Light mode switch row */}
                <div className="relative flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
                  >
                    {theme === "dark" ? (
                      <>🌙 Dark Mode</>
                    ) : (
                      <>☀️ Light Mode</>
                    )}
                  </button>
                </div>

                {/* Language Switch Row */}
                <div className="relative flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Language</span>
                  <div className="flex rounded-xl bg-slate-100 dark:bg-white/10 p-0.5 border border-slate-200/50 dark:border-white/5 overflow-hidden">
                    <button
                      onClick={() => changeLanguage("en")}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider transition ${
                        language === "en"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => changeLanguage("hi")}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider transition ${
                        language === "hi"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                {/* Action button: Settings */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    nav("/settings");
                  }}
                  className="
                    relative w-full flex items-center justify-between text-xs py-2.5 px-4 rounded-xl font-bold
                    bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all duration-300
                    dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200
                  "
                >
                  <span>Portal Settings</span>
                  <Settings size={15} />
                </button>

                {/* Action button: Logout */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("user");
                    nav("/login");
                  }}
                  className="
                    relative w-full flex items-center justify-between text-xs py-2.5 px-4 rounded-xl font-bold
                    bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 border border-rose-500/20 transition-all duration-300
                    dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30
                  "
                >
                  <span>Log Out</span>
                  <LogOut size={15} />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ================= WELCOME BANNER PANEL ================= */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 dark:border-white/10 shadow-[0_30px_60px_rgba(14,165,233,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.55)]">
          {/* Internal gradient backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-transparent dark:via-transparent dark:to-transparent" />
          <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(135deg,#070716_0%,#090e24_50%,#13193a_100%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.3),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.4),transparent_60%)]" />

          {/* Shiny backdrop overlay */}
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] bg-grid-mesh pointer-events-none" />

          <div className="relative z-10 px-5 py-6 md:px-10 md:py-10 grid gap-5 md:gap-8 md:grid-cols-[1fr,auto] items-center">
            
            {/* Greeting & Subtitle */}
            <div className="space-y-3 md:space-y-4">
              <p className="text-[10px] md:text-xs font-black tracking-widest text-sky-200 dark:text-cyan-300 uppercase">
                {t.welcomeBack}
              </p>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                {currentUser?.name}
              </h1>
              <p className="text-[11px] md:text-sm leading-relaxed text-sky-50 dark:text-slate-300 max-w-xl">
                {language === "en"
                  ? "Launch interactive simulators, build hardware models, code logic, and explore the universe using futuristic science modules."
                  : "इंटरएक्टिव सिमुलेटर चलाएं, हार्डवेयर मॉडल बनाएं, कोडिंग करें और विज्ञान के उन्नत मॉड्यूल्स का उपयोग करके ब्रह्मांड का पता लगाएं।"}
              </p>

              {/* Gamification Stats */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/10">
                {/* Level badge */}
                <div className="
                  inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-2xl aura-glow-cyan
                  bg-white/10 border border-white/20 text-white font-black text-[10px] md:text-xs
                ">
                  <span className="w-4 h-4 md:w-5 md:h-5 rounded-md md:rounded-lg flex items-center justify-center bg-cyan-400 text-slate-950 font-black text-[9px] md:text-[10px]">
                    {gamification.level}
                  </span>
                  <span>Level {gamification.level}</span>
                </div>

                {/* XP Progress bar */}
                <div className="flex items-center gap-2 flex-1 min-w-[150px] max-w-[300px]">
                  <div className="h-2 rounded-full bg-white/20 flex-1 overflow-hidden border border-white/10 relative">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-cyan-400 rounded-full"
                      style={{ width: `${(gamification.xp / gamification.maxXp) * 100}%` }}
                      layout
                    />
                  </div>
                  <span className="text-[10px] font-black text-white/90 whitespace-nowrap">
                    {gamification.xp} / {gamification.maxXp} XP
                  </span>
                </div>

                {/* Coins badge */}
                <div className="
                  inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-2xl
                  bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-black text-[10px] md:text-xs
                ">
                  <span>🪙</span>
                  <span>{gamification.coins} {language === "en" ? "Coins" : "सिक्के"}</span>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Stats or Graphic */}
            <div className="flex justify-start md:justify-end items-center relative pr-0 md:pr-4 mt-1 md:mt-0 w-full">
              {todayChallenges.length > 0 ? (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChallengeIndex(0)}
                  className="w-full md:max-w-[300px] rounded-2xl md:rounded-3xl p-[2px] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 cursor-pointer shadow-[0_15px_30px_rgba(6,182,212,0.2)] md:shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.4)] md:hover:shadow-[0_25px_50px_rgba(6,182,212,0.5)] transition-all"
                >
                  <div className="rounded-[20px] md:rounded-[22px] bg-[#0A0F1C]/90 backdrop-blur-xl p-3 sm:p-4 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center text-left md:text-center relative overflow-hidden gap-3 md:gap-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.2),transparent_70%)]" />
                    
                    <div className="w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center md:mb-4 border border-cyan-500/30">
                      <Target className="w-5 h-5 md:w-8 md:h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    </div>
                    
                    <div className="flex-1 md:w-full">
                      <h4 className="text-white text-sm md:text-xl font-black md:mb-1 leading-tight">
                        {language === "en" ? `${todayChallenges.length} Quest${todayChallenges.length > 1 ? 's' : ''} Available!` : `${todayChallenges.length} दैनिक खोज उपलब्ध!`}
                      </h4>
                      <p className="text-cyan-200/70 text-[10px] md:text-xs font-bold md:mb-4 hidden sm:block md:block">
                        {language === "en" ? "Solve now to earn XP" : "XP कमाने के लिए हल करें"}
                      </p>
                    </div>
                    
                    <button className="px-4 py-2 md:px-5 shrink-0 rounded-full bg-cyan-500 text-slate-900 font-bold text-xs md:text-sm hover:bg-cyan-400 transition md:w-full shadow-[0_0_10px_rgba(34,211,238,0.4)] md:shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                      {language === "en" ? "Play Now" : "अभी खेलें"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border border-white/40 bg-white/15 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/0 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.5),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.2),transparent_70%)]" />
                  <Award size={48} className="text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] mb-3" />
                  <h4 className="text-white text-3xl font-black drop-shadow-md">{gamification.xp}</h4>
                  <p className="text-white drop-shadow-md dark:text-sky-300/70 text-[10px] font-bold tracking-widest uppercase mt-1 text-center">Total XP<br/>Earned</p>
                </div>
              )}
            </div>

          </div>
        </section>



        {/* ================= STEAM SHORTS SECTION (IG STORIES STYLE) ================= */}
        <section className="w-full">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-pink-500/10 text-pink-500 rounded-xl"><Sparkles size={20} /></span>
              {language === "en" ? "STEAM Shorts" : "स्टीम शॉर्ट्स"}
            </h2>
          </div>
          <STEAMShortsSection language={language} />
        </section>

        {/* ================= INTERACTIVE SCIENCE SECTION (3D TILT CARDS) ================= */}
        <section className="space-y-5">
          <div className="text-center md:text-left">
            <span className="
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
              bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300 border border-purple-500/20
            ">
              <Sparkles size={12} className="animate-spin-slow" />
              {language === "en" ? "IMMERSIVE LABS" : "इमर्सिव लैब्स"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-slate-900 dark:text-white">
              {t.highlightsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
              {language === "en"
                ? "Enter virtual reality labs directly from your browser. Click on a universe to explore."
                : "अपने ब्राउज़र से सीधे वर्चुअल रियलिटी लैब में प्रवेश करें। अन्वेषण करने के लिए क्लिक करें।"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Solar System */}
            <motion.div
              onMouseMove={handle3DTilt}
              onMouseLeave={reset3DTilt}
              onClick={handleSolarSystemClick}
              className="
                group relative tilt-element rounded-3xl overflow-hidden cursor-pointer p-[2px]
                bg-gradient-to-tr from-cyan-400 to-blue-500
                shadow-[0_20px_40px_rgba(6,182,212,0.2)] hover:shadow-[0_25px_50px_rgba(6,182,212,0.3)]
              "
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-xl dark:bg-slate-950/80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
                
                {/* 3D reflection highlight */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.15), transparent 50%)"
                  }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-cyan-500/10 text-cyan-500 border border-cyan-500/15">
                    🪐
                  </div>
                  <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                    Space
                  </span>
                </div>

                <div className="mt-12 relative z-10 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    Solar System
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Explore active orbits, rotating planets, gravity zones, and space tech simulators.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 relative z-10">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    3D Simulation
                  </span>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-500 text-white shadow-md shadow-cyan-500/20 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Anatomy */}
            <motion.div
              onMouseMove={handle3DTilt}
              onMouseLeave={reset3DTilt}
              onClick={handleHumanBodyClick}
              className="
                group relative tilt-element rounded-3xl overflow-hidden cursor-pointer p-[2px]
                bg-gradient-to-tr from-rose-400 to-pink-500
                shadow-[0_20px_40px_rgba(244,63,94,0.2)] hover:shadow-[0_25px_50px_rgba(244,63,94,0.3)]
              "
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-xl dark:bg-slate-950/80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_50%)]" />
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.15), transparent 50%)"
                  }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-rose-500/10 text-rose-500 border border-rose-500/15">
                    🫀
                  </div>
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                    Anatomy
                  </span>
                </div>

                <div className="mt-12 relative z-10 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                    Human Body
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Examine interactive organs, beating heart ventricles, neural circuits, and bones.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 relative z-10">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    3D Simulation
                  </span>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Robotics */}
            <motion.div
              onMouseMove={handle3DTilt}
              onMouseLeave={reset3DTilt}
              onClick={handleRoboticsClick}
              className="
                group relative tilt-element rounded-3xl overflow-hidden cursor-pointer p-[2px]
                bg-gradient-to-tr from-purple-400 to-indigo-500
                shadow-[0_20px_40px_rgba(99,102,241,0.2)] hover:shadow-[0_25px_50px_rgba(99,102,241,0.3)]
              "
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-xl dark:bg-slate-950/80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.15), transparent 50%)"
                  }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-indigo-500/10 text-indigo-500 border border-indigo-500/15">
                    🤖
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Robotics
                  </span>
                </div>

                <div className="mt-12 relative z-10 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    Robotics & AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Build automation code logic, script virtual robotic arms, and run tests in real-time.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 relative z-10">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    3D Simulation
                  </span>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Molecules */}
            <motion.div
              onMouseMove={handle3DTilt}
              onMouseLeave={reset3DTilt}
              onClick={handleMoleculesClick}
              className="
                group relative tilt-element rounded-3xl overflow-hidden cursor-pointer p-[2px]
                bg-gradient-to-tr from-emerald-400 to-teal-500
                shadow-[0_20px_40px_rgba(16,185,129,0.2)] hover:shadow-[0_25px_50px_rgba(16,185,129,0.3)]
              "
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col justify-between overflow-hidden bg-white/90 backdrop-blur-xl dark:bg-slate-950/80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.15), transparent 50%)"
                  }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                    ⚛️
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Chemistry
                  </span>
                </div>

                <div className="mt-12 relative z-10 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    Molecules Lab
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Manipulate molecular bonds, study DNA double helixes, and trigger virtual compound reactions.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 relative z-10">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    3D Simulation
                  </span>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ================== ACTIVE COURSES IN YOUR SCHOOL ================== */}
        <section className="space-y-5">
          <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300 border border-purple-500/20
              ">
                <BookOpen size={12} />
                {language === "en" ? "CURRENT ENROLLMENTS" : "वर्तमान नामांकन"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-slate-900 dark:text-white">
                {t.activeCoursesTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
                {t.activeCoursesSub}
              </p>
            </div>
            {loadingSchoolCourses && (
              <span className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                Syncing Live
              </span>
            )}
          </div>

          {/* Cards Container Grid */}
          <div className="relative rounded-[32px] p-2 overflow-hidden border border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-3xl dark:bg-[#07050e]/90" />
            <div className="absolute inset-0 bg-grid-mesh opacity-[0.06]" />

            <div className="relative z-10 p-5 md:p-6 min-h-[220px]">
              
              {/* Error State */}
              {!!schoolCoursesError && (
                <div className="py-10 text-center space-y-3">
                  <div className="text-4xl">⚠️</div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    {language === "en" ? "Failed to synchronize courses" : "कोर्स सिंक करने में विफल"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {String(schoolCoursesError)}
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!loadingSchoolCourses && !schoolCoursesError && (!activeSchoolCourses || activeSchoolCourses.length === 0) && (
                <div className="py-12 text-center space-y-3">
                  <div className="text-4xl">📚</div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    {language === "en" ? "No Active School Courses Assigned" : "कोई एक्टिव स्कूल कोर्स असाइन नहीं है"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {language === "en" 
                      ? "When your class teacher assigns active syllabus courses, they will appear here with live tracking metrics."
                      : "जब आपके शिक्षक आपकी क्लास को कोई कोर्स असाइन करेंगे, वह यहाँ लाइव प्रोग्रेस के साथ दिखाई देगा।"}
                  </p>
                </div>
              )}

              {/* Skeletons while loading */}
              {loadingSchoolCourses && activeSchoolCourses.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-white/5 h-44 rounded-3xl border border-transparent dark:border-white/5" />
                  ))}
                </div>
              )}

              {/* Grid content */}
              {!schoolCoursesError && activeSchoolCourses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSchoolCourses.map((c, idx) => {
                    
                    const THEMES = [
                      {
                        border: "hover:border-cyan-400/50",
                        glow: "rgba(6,182,212,0.25)",
                        badge: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-500/20",
                        progressFill: "bg-gradient-to-r from-cyan-400 to-sky-500",
                        button: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/20",
                        orbColor: "from-cyan-400/20 to-sky-500/10",
                      },
                      {
                        border: "hover:border-purple-400/50",
                        glow: "rgba(168,85,247,0.25)",
                        badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
                        progressFill: "bg-gradient-to-r from-purple-400 to-indigo-500",
                        button: "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20",
                        orbColor: "from-purple-400/20 to-indigo-500/10",
                      },
                      {
                        border: "hover:border-emerald-400/50",
                        glow: "rgba(16,185,129,0.25)",
                        badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
                        progressFill: "bg-gradient-to-r from-emerald-400 to-teal-500",
                        button: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
                        orbColor: "from-emerald-400/20 to-teal-500/10",
                      }
                    ];

                    const cTheme = THEMES[idx % THEMES.length];
                    const pct = Math.max(0, Math.min(100, Math.round(c.progressPct)));
                    
                    return (
                      <motion.div
                        key={c.id}
                        onMouseMove={handle3DTilt}
                        onMouseLeave={reset3DTilt}
                        whileHover={{ y: -6, scale: 1.02 }}
                        className={`
                          group relative overflow-hidden rounded-3xl p-5 border transition-all duration-300
                          bg-white dark:bg-slate-950/70 border-slate-200 dark:border-white/5 ${cTheme.border}
                        `}
                        style={{
                          transformStyle: "preserve-3d",
                          transform: "perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
                        }}
                      >
                        {/* Dynamic background light orb */}
                        <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full bg-gradient-to-br ${cTheme.orbColor} blur-2xl group-hover:scale-125 transition-transform duration-500`} />
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), ${cTheme.glow}, transparent 55%)`
                          }}
                        />

                        {/* Top Info Header */}
                        <div className="flex items-start justify-between gap-3 relative z-10">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${cTheme.badge}`}>
                              {c.categoryEmoji} {pickLang(c.categoryLabel, "Course")}
                            </span>
                            <h3 className="text-base font-black text-slate-800 dark:text-white mt-2 line-clamp-1 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                              {pickLang(c.title, "Untitled Course")}
                            </h3>
                          </div>
                          
                          {/* Course Icon Circle */}
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xl shadow-inner shrink-0">
                            {c.emoji}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed relative z-10">
                          {pickLang(c.sub, "Lessons • Activities • Projects")}
                        </p>

                        {/* Progress meter */}
                        <div className="mt-5 space-y-2 relative z-10">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span>Syllabus Completion</span>
                            <span className="font-black text-slate-900 dark:text-white">{pct}%</span>
                          </div>

                          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden border border-slate-200/50 dark:border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={`h-full rounded-full ${cTheme.progressFill}`}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500">
                            <span>{c.completedLessons} / {c.totalLessons} Lessons</span>
                            {c.lastUpdated && <span>Updated recently</span>}
                          </div>
                        </div>

                        {/* Card action footer */}
                        <div className="mt-5 border-t border-slate-100 dark:border-white/5 pt-3 flex items-center justify-end relative z-10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => nav(`/courses/${c.courseId}`)}
                            className={`
                              inline-flex items-center gap-1 px-4.5 py-2 rounded-xl text-xs font-black shadow-md
                              ${cTheme.button}
                            `}
                          >
                            {language === "en" ? "Launch Course" : "कोर्स शुरू करें"}
                            <ArrowRight size={13} />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ====================== QUICK ACCESS BAR (MATTE STYLE) ====================== */}
        <section className="space-y-5">
          <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20
              ">
                <Zap size={12} />
                {language === "en" ? "SHORTCUTS" : "शॉर्टकट"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-slate-900 dark:text-white">
                {t.quickAccessTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
                {language === "en" ? "Access shortcut learning material instantly." : "शॉर्टकट शिक्षण सामग्री तक तुरंत पहुंचें।"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {quickActions.map((act, index) => {
              
              const MATTE_COLORS = [
                {
                  bg: "bg-blue-50/80 border-blue-100 hover:border-blue-300 hover:bg-blue-100/80 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/15 dark:text-blue-300",
                  iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-500/25",
                  glow: "rgba(59,130,246,0.15)"
                },
                {
                  bg: "bg-violet-50/80 border-violet-100 hover:border-violet-300 hover:bg-violet-100/80 text-violet-800 dark:bg-violet-500/10 dark:border-violet-500/15 dark:text-violet-300",
                  iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-500/25",
                  glow: "rgba(139,92,246,0.15)"
                },
                {
                  bg: "bg-amber-50/80 border-amber-100 hover:border-amber-300 hover:bg-amber-100/80 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/15 dark:text-amber-300",
                  iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-500/25",
                  glow: "rgba(245,158,11,0.15)"
                },
                {
                  bg: "bg-emerald-50/80 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/15 dark:text-emerald-300",
                  iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/25",
                  glow: "rgba(16,185,129,0.15)"
                },
                {
                  bg: "bg-rose-50/80 border-rose-100 hover:border-rose-300 hover:bg-rose-100/80 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/15 dark:text-rose-300",
                  iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-500/25",
                  glow: "rgba(244,63,94,0.15)"
                },
                {
                  bg: "bg-cyan-50/80 border-cyan-100 hover:border-cyan-300 hover:bg-cyan-100/80 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-500/15 dark:text-cyan-300",
                  iconBg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/25",
                  glow: "rgba(6,182,212,0.15)"
                }
              ];

              const design = MATTE_COLORS[index % MATTE_COLORS.length];

              return (
                <motion.button
                  key={act.key}
                  onClick={() => nav(act.path)}
                  whileHover={{ y: -5, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    relative rounded-3xl p-5 border text-left flex flex-col justify-between min-h-[125px] overflow-hidden transition-all duration-300
                    shadow-[0_8px_20px_rgba(0,0,0,0.04)]
                    ${design.bg}
                  `}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(120px circle, ${design.glow}, transparent 60%)`
                    }}
                  />

                  {/* Icon Circle */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${design.iconBg}`}>
                    {act.icon}
                  </div>

                  {/* Label */}
                  <div className="mt-6 flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-800 dark:text-white">
                      {act.label[language]}
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ================= REFERENCE TOOLS SECTION ================= */}
        <section className="space-y-5">
          <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300 border border-blue-500/20
              ">
                <Wrench size={12} />
                {language === "en" ? "REFERENCE TOOLS" : "संदर्भ उपकरण"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-slate-900 dark:text-white">
                {language === "en" ? "Software & Resources" : "सॉफ्टवेयर और संसाधन"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
                {language === "en"
                  ? "Essential tools for 3D designing, slicing, game making, and robotics."
                  : "3D डिजाइनिंग, गेम मेकिंग और रोबोटिक्स के लिए आवश्यक उपकरण।"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/reference-tools")}
              className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center justify-center md:justify-start gap-1 bg-blue-500/10 px-4 py-2 rounded-xl hover:bg-blue-500/20 transition-colors"
            >
              {language === "en" ? "View All" : "सभी देखें"}
              <ArrowRight size={14} />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <motion.a
              href="https://www.tinkercad.com/" target="_blank" rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-tr from-blue-400 to-cyan-500 shadow-[0_15px_35px_rgba(56,189,248,0.25)] hover:shadow-[0_25px_45px_rgba(56,189,248,0.4)] transition-shadow"
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col overflow-hidden bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_60%)]" />
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-6 self-start shadow-lg shadow-cyan-500/30">
                  <Box className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors">Tinkercad</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold">3D Design & Electronics</p>
              </div>
            </motion.a>

            <motion.a
              href="https://scratch.mit.edu/" target="_blank" rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-tr from-pink-400 to-rose-500 shadow-[0_15px_35px_rgba(244,63,94,0.25)] hover:shadow-[0_25px_45px_rgba(244,63,94,0.4)] transition-shadow"
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col overflow-hidden bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_60%)]" />
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-6 self-start shadow-lg shadow-rose-500/30">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">Scratch</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold">Game & Animations</p>
              </div>
            </motion.a>

            <motion.a
              href="https://mblock.makeblock.com/" target="_blank" rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_15px_35px_rgba(16,185,129,0.25)] hover:shadow-[0_25px_45px_rgba(16,185,129,0.4)] transition-shadow"
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col overflow-hidden bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white mb-6 self-start shadow-lg shadow-emerald-500/30">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-500 transition-colors">mBlock</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold">Robotics & Coding</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.anycubic.com/pages/anycubic-slicer-software" target="_blank" rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-tr from-amber-400 to-orange-500 shadow-[0_15px_35px_rgba(245,158,11,0.25)] hover:shadow-[0_25px_45px_rgba(245,158,11,0.4)] transition-shadow"
            >
              <div className="relative rounded-[22px] p-6 h-full flex flex-col overflow-hidden bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)]" />
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-6 self-start shadow-lg shadow-orange-500/30">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-orange-500 transition-colors">Anycubic Slicer</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold">3D Slicing</p>
              </div>
            </motion.a>

          </div>
        </section>

        {/* ================= EVENTS AND CLUB CORNER ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {t.upcomingTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en" ? "Compete with other schools in workshops & hackathons." : "वर्कशॉप और हैकाथॉन में अन्य स्कूलों के साथ प्रतिस्पर्धा करें।"}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/profile")}
              className="text-xs font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-3.5 py-2 rounded-xl"
            >
              {t.seeCalendar}
              <ArrowRight size={14} />
            </motion.button>
          </div>

          <div className="flex flex-col gap-4">
            {events.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8 bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                {language === "en" ? "No upcoming events right now!" : "अभी कोई आगामी कार्यक्रम नहीं है!"}
              </div>
            )}
            {events.map((e, idx) => {
              const theme = (() => {
                switch (e.themeColor) {
                  case "cyan": return { dot: "bg-cyan-500", glow: "bg-cyan-500/5", box: "from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-600 dark:from-cyan-950/40 dark:to-cyan-900/10 dark:border-cyan-500/20 dark:text-cyan-300", hover: "hover:border-cyan-400/50" };
                  case "rose": return { dot: "bg-rose-500", glow: "bg-rose-500/5", box: "from-rose-50 to-rose-100/50 border-rose-200 text-rose-600 dark:from-rose-950/40 dark:to-rose-900/10 dark:border-rose-500/20 dark:text-rose-300", hover: "hover:border-rose-400/50" };
                  case "emerald": return { dot: "bg-emerald-500", glow: "bg-emerald-500/5", box: "from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-600 dark:from-emerald-950/40 dark:to-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-300", hover: "hover:border-emerald-400/50" };
                  case "amber": return { dot: "bg-amber-500", glow: "bg-amber-500/5", box: "from-amber-50 to-amber-100/50 border-amber-200 text-amber-600 dark:from-amber-950/40 dark:to-amber-900/10 dark:border-amber-500/20 dark:text-amber-300", hover: "hover:border-amber-400/50" };
                  default: return { dot: "bg-indigo-500", glow: "bg-indigo-500/5", box: "from-indigo-50 to-indigo-100/50 border-indigo-200 text-indigo-600 dark:from-indigo-950/40 dark:to-indigo-900/10 dark:border-indigo-500/20 dark:text-indigo-300", hover: "hover:border-indigo-400/50" };
                }
              })();

              const dateParts = (e.dateStr || "").split(" ");
              const day = dateParts[0] || "??";
              const month = dateParts[1] || "---";

              return (
              <motion.div
                key={e._id || e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  relative rounded-3xl p-5 border overflow-hidden transition-all duration-300
                  bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${theme.hover}
                  dark:bg-slate-950/50 dark:border-white/5 dark:hover:border-white/15 dark:shadow-[0_15px_40px_rgba(0,0,0,0.4)]
                `}
              >
                <div className="absolute inset-0 bg-grid-mesh opacity-[0.04]" />
                <div className={`absolute -left-12 -top-12 w-24 h-24 ${theme.glow} rounded-full blur-2xl`} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Calendar visual badge */}
                    <div className={`
                      w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border
                      bg-gradient-to-br ${theme.box}
                    `}>
                      <span className="text-[12px] font-black leading-none">{day}</span>
                      <span className="text-[8px] font-extrabold opacity-80 uppercase mt-0.5">{month}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">
                        {e.title?.[language] || e.title?.en}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                          {e.type?.[language] || e.type?.en}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          🏆 {language === "en" ? "STEAM Club" : "STEAM क्लब"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Register action button */}
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="
                      self-start sm:self-auto px-5 py-2.5 rounded-xl text-xs font-black text-white
                      bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25
                    "
                  >
                    {language === "en" ? "Register Expo" : "एक्सपो रजिस्टर"}
                  </motion.button>
                </div>
              </motion.div>
              );
            })}
          </div>
        </section>

      {/* Confetti Level-up Modal */}
      <AnimatePresence>
        {levelUpMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="
                relative max-w-sm w-full p-8 rounded-[32px] text-center space-y-4 overflow-hidden border border-white/20
                bg-gradient-to-b from-cyan-900/40 via-slate-950/90 to-slate-950 shadow-[0_30px_70px_rgba(6,182,212,0.3)]
              "
            >
              <div className="absolute inset-0 bg-grid-mesh opacity-10" />
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                LEVEL UP!
              </h2>
              <p className="text-white font-extrabold text-lg">
                {language === "en" ? `You reached Level ${levelUpMsg}!` : `आप लेवल ${levelUpMsg} पर पहुँच गए!`}
              </p>
              <p className="text-xs text-slate-400">
                {language === "en" ? "Unlock more features and customization gear on your Profile." : "अपनी प्रोफ़ाइल पर अधिक फीचर्स और गियर अनलॉक करें।"}
              </p>
              <button
                onClick={() => setLevelUpMsg(null)}
                className="
                  w-full py-2.5 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition
                "
              >
                {language === "en" ? "Awesome!" : "शानदार!"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {rewardPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-4 py-3 rounded-2xl flex items-center justify-between border
              bg-slate-900/90 border-cyan-500/30 text-white shadow-[0_20px_50px_rgba(6,182,212,0.2)] backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <div>
                <p className="text-xs font-black">{rewardPopup.message}</p>
                <p className="text-[10px] text-cyan-400 font-extrabold">
                  +{rewardPopup.xp} XP · +{rewardPopup.coins} Coins {rewardPopup.badge ? `· Badge: ${rewardPopup.badge}` : ""}
                </p>
              </div>
            </div>
            <button onClick={() => setRewardPopup(null)} className="text-xs font-bold text-slate-400 hover:text-white px-2">
              Ok
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= STEAMBUDDY MASCOT ASSISTANT ================= */}
      <div className="fixed bottom-36 md:bottom-24 right-6 z-40">
        <motion.button
          onClick={() => setMascotOpen(true)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="
            w-14 h-14 rounded-full flex items-center justify-center border aura-glow-cyan relative
            bg-slate-900 border-cyan-500/40 text-cyan-400 text-3xl shadow-lg
          "
        >
          🤖
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-cyan-500" />
        </motion.button>
      </div>

      <AnimatePresence>
        {mascotOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMascotOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 25 }}
              className="
                fixed bottom-[14rem] md:bottom-40 right-4 left-4 md:left-auto md:right-8 md:w-[360px] z-50 p-5 rounded-[28px] border space-y-4
                bg-white border-slate-200 shadow-2xl backdrop-blur-xl
                dark:bg-slate-950/90 dark:border-white/10
              "
            >
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-float-slow">🤖</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">STEAMbuddy AI</h4>
                    <p className="text-[9px] font-bold text-emerald-500">Online Companion</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMascotOpen(false);
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300"
                >
                  Minimize
                </button>
              </div>

              {/* Speech Waveform Visualizer */}
              <div className="h-16 flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden relative">
                {isSpeaking ? (
                  <div className="flex items-end justify-center h-8 gap-1.5 w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="w-1.5 bg-cyan-400 rounded-full wave-bar" style={{ height: `${20 + i * 5}px` }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-bold">
                    {language === "en" ? "Tap a shortcut button below!" : "नीचे दिए गए किसी बटन को टैप करें!"}
                  </p>
                )}
              </div>

              {/* Chat Message dialog */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-3 text-xs leading-relaxed max-h-[140px] overflow-y-auto custom-scroll font-medium text-slate-700 dark:text-slate-200">
                {mascotMsg}
              </div>

              {/* Shortcut buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerMascotResponse("fact")}
                  className="px-3 py-2 rounded-xl text-[10px] font-black border text-left flex items-center gap-1 bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-300"
                >
                  💡 {language === "en" ? "Science Fact" : "विज्ञान तथ्य"}
                </button>
                <button
                  onClick={() => triggerMascotResponse("motivation")}
                  className="px-3 py-2 rounded-xl text-[10px] font-black border text-left flex items-center gap-1 bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-300"
                >
                  🚀 {language === "en" ? "Motivation" : "प्रेरणा"}
                </button>
                <button
                  onClick={() => triggerMascotResponse("tip")}
                  className="px-3 py-2 rounded-xl text-[10px] font-black border text-left flex items-center gap-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                >
                  🧪 {language === "en" ? "Study Tip" : "अध्ययन टिप"}
                </button>
                <button
                  onClick={() => {
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setMascotMsg(language === "en" ? "Beep boop! Speech cancelled. Select another button." : "बीप बूप! आवाज़ बंद कर दी गई है।");
                  }}
                  className="px-3 py-2 rounded-xl text-[10px] font-black border text-left flex items-center gap-1 bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300"
                >
                  🔇 {language === "en" ? "Stop Speech" : "आवाज़ रोकें"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DOUBT CHAT FLOATING WIDGET */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
        <motion.button
          onClick={() => nav("/doubts")}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="
            w-14 h-14 rounded-full flex items-center justify-center border aura-glow-cyan relative
            bg-blue-600 border-blue-400/40 text-white shadow-lg shadow-blue-500/30
          "
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-rose-500" />
        </motion.button>
      </div>
      </div>

      {/* ================= CHALLENGE MODAL ================= */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/80"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedChallengeIndex(null)}
                className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {todayChallenges.length > 1 && (
                <div className="absolute -top-12 left-0 flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedChallengeIndex(prev => prev > 0 ? prev - 1 : todayChallenges.length - 1)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition backdrop-blur-md font-bold"
                  >
                    ←
                  </button>
                  <span className="text-white/80 font-bold text-xs bg-black/50 px-3 py-1 rounded-full">
                    {selectedChallengeIndex + 1} / {todayChallenges.length}
                  </span>
                  <button 
                    onClick={() => setSelectedChallengeIndex(prev => prev < todayChallenges.length - 1 ? prev + 1 : 0)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition backdrop-blur-md font-bold"
                  >
                    →
                  </button>
                </div>
              )}

              <DailyChallengeCard 
                challenge={selectedChallenge} 
                language={language} 
                token={token} 
                onAttemptSuccess={(pts) => {
                  handleAttemptSuccess(pts);
                  // Optional: Automatically close after success, or let the user see the result
                  // setTimeout(() => setSelectedChallenge(null), 3000);
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
