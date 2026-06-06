// ✅ src/pages/profile/Profile.jsx
// Update:
// ✅ Theme + Language + Logout moved UNDER student card (like your screenshot "Quick Settings")
// ✅ Location removed from student details
// ✅ Keeps: pickText() fix for {en,hi} objects
// ✅ Keeps: modern neon + 3D + animations

import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  School,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Trophy,
  Layers,
  StickyNote,
  Eye,
  Heart,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { api, getApiError, clearAuthTokens } from "../../api/axios";

const cn = (...s) => s.filter(Boolean).join(" ");
const spring = { type: "spring", stiffness: 260, damping: 22 };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: spring } };

function formatDate(dt) {
  try {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

// ✅ Converts {en,hi} (or arrays/objects) into a render-safe string
function pickText(v, lang = "en") {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map((x) => pickText(x, lang)).filter(Boolean).join(", ");
  if (typeof v === "object") {
    if (v[lang] != null) return pickText(v[lang], lang);
    if (v.en != null) return pickText(v.en, lang);
    if (v.hi != null) return pickText(v.hi, lang);
  }
  return "";
}

/* =================== UI =================== */

function Glass({ theme, className, children }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border backdrop-blur-xl",
        theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/70",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />
      {children}
    </div>
  );
}

function NeonCard({ theme, tone = "violet", className, children }) {
  const tones = {
    violet: {
      bg: "from-violet-500/20 via-fuchsia-500/15 to-pink-500/15",
      glow1: "bg-fuchsia-500/25",
      glow2: "bg-violet-500/20",
      ring: "from-violet-500 via-fuchsia-500 to-pink-500",
    },
    ocean: {
      bg: "from-sky-500/20 via-indigo-500/15 to-cyan-500/15",
      glow1: "bg-sky-500/25",
      glow2: "bg-cyan-500/20",
      ring: "from-sky-500 via-indigo-500 to-cyan-500",
    },
    mint: {
      bg: "from-emerald-500/18 via-teal-500/14 to-cyan-500/14",
      glow1: "bg-emerald-500/22",
      glow2: "bg-cyan-500/18",
      ring: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    sunset: {
      bg: "from-amber-500/18 via-orange-500/14 to-rose-500/14",
      glow1: "bg-orange-500/22",
      glow2: "bg-rose-500/18",
      ring: "from-amber-500 via-orange-500 to-rose-500",
    },
  };
  const t = tones[tone] || tones.violet;

  return (
    <motion.div
      layout
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={spring}
      className={cn(
        "relative overflow-hidden rounded-[28px] border backdrop-blur-xl will-change-transform",
        theme === "dark" ? "border-white/10 bg-white/5 text-white" : "border-black/5 bg-white/70 text-slate-900",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", t.bg)} />
      <div className={cn("pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full blur-[90px]", t.glow1)} />
      <div className={cn("pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-[90px]", t.glow2)} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />
      <div className={cn("pointer-events-none absolute inset-0 opacity-20 bg-gradient-to-r", t.ring)} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function InfoRow({ theme, icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={cn("shrink-0", theme === "dark" ? "text-white/80" : "text-slate-800")}>{icon}</span>
      <span className={cn("truncate", theme === "dark" ? "text-white/85" : "text-slate-900")}>{text || "—"}</span>
    </div>
  );
}

function StatPill({ theme, icon, label, value, accent = "ocean" }) {
  const accents = {
    ocean: "from-sky-500/25 via-indigo-500/20 to-cyan-500/20",
    violet: "from-violet-500/25 via-fuchsia-500/20 to-pink-500/20",
    mint: "from-emerald-500/22 via-teal-500/18 to-cyan-500/18",
    sunset: "from-amber-500/22 via-orange-500/18 to-rose-500/18",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={spring}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4",
        theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/75"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accents[accent] || accents.ocean)} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />

      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl border",
            theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/70"
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-slate-600")}>{label}</div>
          <div className="mt-0.5 truncate text-lg font-extrabold">{value ?? "—"}</div>
        </div>
      </div>
    </motion.div>
  );
}

function MiniList({ theme, title, items = [], empty = "No data", accent = "mint" }) {
  const accents = {
    ocean: "from-sky-500/18 via-indigo-500/12 to-cyan-500/12",
    violet: "from-violet-500/18 via-fuchsia-500/12 to-pink-500/12",
    mint: "from-emerald-500/16 via-teal-500/10 to-cyan-500/10",
    sunset: "from-amber-500/16 via-orange-500/10 to-rose-500/10",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4",
        theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/75"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accents[accent] || accents.mint)} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />

      <div className="relative flex items-center justify-between">
        <div className="text-sm font-extrabold">{title}</div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
            theme === "dark" ? "bg-white/10 text-white/85 ring-white/15" : "bg-white/70 text-slate-800 ring-black/10"
          )}
        >
          {items.length}
        </span>
      </div>

      <div className="relative mt-3 space-y-2">
        {items.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border p-3 text-sm",
              theme === "dark" ? "border-white/10 bg-white/5 text-white/60" : "border-black/5 bg-white/70 text-slate-600"
            )}
          >
            {empty}
          </div>
        ) : (
          items.slice(0, 5).map((it, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 4 }}
              transition={spring}
              className={cn(
                "flex items-start justify-between gap-3 rounded-2xl border p-3",
                theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/70"
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{it.title || "—"}</div>
                {it.meta ? (
                  <div className={cn("mt-1 text-xs", theme === "dark" ? "text-white/60" : "text-slate-600")}>{it.meta}</div>
                ) : null}
              </div>
              <ChevronRight className={cn("h-4 w-4 shrink-0", theme === "dark" ? "text-white/60" : "text-slate-500")} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/** ✅ Quick Settings panel like screenshot */
function QuickSettings({ theme, language, onToggleTheme, onToggleLanguage, onLogout }) {
  const isDark = theme === "dark";
  const langLabel = language === "hi" ? "Hindi" : "English";

  return (
    <NeonCard theme={theme} tone="mint" className="mt-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              isDark ? "border-white/10 bg-white/5 text-white/75" : "border-black/10 bg-white/70 text-slate-700"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </div>

          <div className="mt-3 text-2xl font-black">
            Quick{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Settings
            </span>
          </div>

          <div className={cn("mt-1 text-sm", isDark ? "text-white/60" : "text-slate-600")}>
            Theme, language & logout — one tap.
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <QuickRow
          theme={theme}
          icon={isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          title="Theme"
          sub={isDark ? "Dark" : "Light"}
          pill="Tap"
          onClick={onToggleTheme}
          tone="ocean"
        />

        <QuickRow
          theme={theme}
          icon={<Languages className="h-5 w-5" />}
          title="Language"
          sub={langLabel}
          pill="Tap"
          onClick={onToggleLanguage}
          tone="violet"
        />

        <QuickRow
          theme={theme}
          icon={<LogOut className="h-5 w-5" />}
          title="Logout"
          sub="Sign out"
          pill="Tap"
          onClick={onLogout}
          tone="sunset"
          danger
        />
      </div>
    </NeonCard>
  );
}

function QuickRow({ theme, icon, title, sub, pill = "Tap", onClick, tone = "ocean", danger = false }) {
  const isDark = theme === "dark";
  const tones = {
    ocean: "from-sky-500/18 via-indigo-500/12 to-cyan-500/12",
    violet: "from-violet-500/18 via-fuchsia-500/12 to-pink-500/12",
    mint: "from-emerald-500/16 via-teal-500/10 to-cyan-500/10",
    sunset: "from-amber-500/16 via-orange-500/10 to-rose-500/10",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={spring}
      className={cn(
        "w-full text-left relative overflow-hidden rounded-3xl border p-4",
        isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white/70"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", tones[tone] || tones.ocean)} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "grid h-12 w-12 place-items-center rounded-2xl border shrink-0",
              isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white/70"
            )}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className={cn("text-sm font-extrabold", isDark ? "text-white" : "text-slate-900")}>{title}</div>
            <div className={cn("text-xs mt-0.5", isDark ? "text-white/60" : "text-slate-600")}>{sub}</div>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 shrink-0",
            danger
              ? isDark
                ? "bg-rose-500/10 text-rose-200 ring-rose-500/25"
                : "bg-rose-50 text-rose-700 ring-rose-500/25"
              : isDark
              ? "bg-white/10 text-white/85 ring-white/15"
              : "bg-white/70 text-slate-800 ring-black/10"
          )}
        >
          {pill}
        </span>
      </div>
    </motion.button>
  );
}

/** ✅ 3D Interactive Mascot Avatar */
function ThreeAvatar({ level, theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 300;
    const height = canvasRef.current.clientHeight || 280;

    const scene = new THREE.Scene();
    const isDark = theme === "dark";
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Head
    const headGeom = new THREE.SphereGeometry(1.0, 32, 32);
    let headColor = 0x8b5cf6; // Purple
    if (level >= 3) headColor = 0x10b981; // Emerald green
    if (level >= 5) headColor = 0xec4899; // Pink / magenta

    const headMat = new THREE.MeshStandardMaterial({
      color: headColor,
      roughness: 0.15,
      metalness: 0.85,
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.0;
    robotGroup.add(head);

    // Visor
    const visorGeom = new THREE.BoxGeometry(1.2, 0.35, 0.7);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x06b6d4,
      emissiveIntensity: level >= 3 ? 1.8 : 0.9,
    });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 1.05, 0.65);
    robotGroup.add(visor);

    // Antennas
    const antGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.4 });
    const antenna = new THREE.Mesh(antGeom, antMat);
    antenna.position.set(0, 2.2, 0);
    robotGroup.add(antenna);

    // Antenna Glow Tip
    const tipGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const tipColor = level >= 5 ? 0xec4899 : level >= 3 ? 0x10b981 : 0x06b6d4;
    const tipMat = new THREE.MeshBasicMaterial({ color: tipColor });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.set(0, 2.45, 0);
    robotGroup.add(tip);

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5 });
    const neck = new THREE.Mesh(neckGeom, neckMat);
    neck.position.y = 0.45;
    robotGroup.add(neck);

    // Body
    const bodyGeom = new THREE.CylinderGeometry(0.85, 0.7, 1.4, 32);
    const bodyColor = level >= 5 ? 0xd946ef : level >= 3 ? 0x059669 : 0x6d28d9;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.2,
      metalness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = -0.4;
    robotGroup.add(body);

    // Floating Base
    const baseGeom = new THREE.ConeGeometry(0.7, 0.5, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.rotation.x = Math.PI;
    base.position.y = -1.35;
    robotGroup.add(base);

    // Hover Fire Jet / Thruster Glow
    const thrusterGeom = new THREE.CylinderGeometry(0.35, 0.01, 0.5, 16);
    const thrusterColor = level >= 5 ? 0xf43f5e : level >= 3 ? 0x10b981 : 0x06b6d4;
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: thrusterColor,
      transparent: true,
      opacity: 0.8,
    });
    const thruster = new THREE.Mesh(thrusterGeom, thrusterMat);
    thruster.position.y = -1.75;
    robotGroup.add(thruster);

    // Glowing Neon Ring/Halo (Level >= 3)
    let ring;
    if (level >= 3) {
      const ringGeom = new THREE.TorusGeometry(1.3, 0.06, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: level >= 5 ? 0xf43f5e : 0x10b981,
        transparent: true,
        opacity: 0.85,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.2;
      ring.position.y = -0.4;
      robotGroup.add(ring);
    }

    // Interactive pointer response
    let mouseX = 0;
    let mouseY = 0;
    const handlePointerMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 2.5;
      mouseY = -y * 1.5;
    };

    const containerElement = canvasRef.current.parentElement;
    containerElement.addEventListener("mousemove", handlePointerMove);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(tipColor, 2.5, 8);
    pointLight.position.set(0, 2.5, 0.5);
    scene.add(pointLight);

    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Floating bounce
      robotGroup.position.y = Math.sin(elapsed * 2.2) * 0.12 - 0.1;
      
      // Idle rotation combined with pointer tracking
      robotGroup.rotation.y = THREE.MathUtils.lerp(robotGroup.rotation.y, elapsed * 0.45 + mouseX, 0.05);
      robotGroup.rotation.x = THREE.MathUtils.lerp(robotGroup.rotation.x, mouseY, 0.05);

      // Flickering thruster flame
      thruster.scale.set(
        1 + Math.sin(elapsed * 45) * 0.1,
        1 + Math.cos(elapsed * 35) * 0.25,
        1 + Math.sin(elapsed * 45) * 0.1
      );

      // Spinning Halo Ring
      if (ring) {
        ring.rotation.z = elapsed * 1.8;
        ring.position.y = -0.4 + Math.sin(elapsed * 2.5) * 0.04;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      containerElement.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [level, theme]);

  return (
    <div className="relative w-full h-[260px] flex items-center justify-center rounded-3xl overflow-hidden bg-black/10 border border-white/5 shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full relative z-10" />
    </div>
  );
}

/* =================== PAGE =================== */

export default function Profile() {
  const themeCtx = useContext(ThemeContext);
  const langCtx = useContext(LanguageContext);
  const navigate = useNavigate();

  const theme = themeCtx?.theme || "dark";
  const language = langCtx?.language || "en";

  const toggleTheme = useCallback(() => {
    if (typeof themeCtx?.toggleTheme === "function") return themeCtx.toggleTheme();
    if (typeof themeCtx?.setTheme === "function") return themeCtx.setTheme(theme === "dark" ? "light" : "dark");
  }, [themeCtx, theme]);

  const toggleLanguage = useCallback(() => {
    if (typeof langCtx?.setLanguage === "function") return langCtx.setLanguage(language === "en" ? "hi" : "en");
  }, [langCtx, language]);

  const t = useMemo(() => {
    const en = {
      kicker: "Student • Profile • Overview",
      titleA: "My",
      titleB: "Profile",
      sub: "A clean summary from your real data (courses, mocks, projects, notes & activity).",
      refresh: "Refresh",
      err: "Failed to load profile",
      stats: "Quick Stats",
      summary: "Learning Summary",
      recCourses: "Recent Courses",
      recMocks: "Recent Mock Attempts",
      recProjects: "Recent Projects",
      live: "Live",
      joined: "Joined",
    };
    const hi = {
      kicker: "Student • Profile • Overview",
      titleA: "मेरा",
      titleB: "प्रोफाइल",
      sub: "Real data ka clean summary (courses, mocks, projects, notes & activity).",
      refresh: "रीफ़्रेश",
      err: "Profile load nahi ho pa raha",
      stats: "Quick Stats",
      summary: "Learning Summary",
      recCourses: "Recent Courses",
      recMocks: "Recent Mock Attempts",
      recProjects: "Recent Projects",
      live: "Live",
      joined: "Joined",
    };
    return language === "hi" ? hi : en;
  }, [language]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const handleSync = (e) => {
      if (e.key === "steam_gamification" || !e.key) {
        try {
          const saved = localStorage.getItem("steam_gamification");
          if (saved) setGamification(JSON.parse(saved));
        } catch {}
      }
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  const badgesList = useMemo(() => [
    {
      id: "Welcome Explorer",
      name: language === "hi" ? "स्वागत एक्सप्लोरर" : "Welcome Explorer",
      desc: language === "hi" ? "स्टीम पोर्टल से जुड़ने पर मिला" : "Awarded for joining the STEAM portal.",
      icon: "🧭",
      color: "from-blue-500 via-sky-400 to-cyan-400",
      accent: "shadow-blue-500/20",
    },
    {
      id: "Daily Challenger",
      name: language === "hi" ? "दैनिक चुनौती विजेता" : "Daily Challenger",
      desc: language === "hi" ? "एक दैनिक पहेली को सफलतापूर्वक हल किया" : "Completed a daily puzzle challenge.",
      icon: "⚡",
      color: "from-amber-500 via-orange-500 to-yellow-500",
      accent: "shadow-orange-500/20",
    },
    {
      id: "Star Astronomer",
      name: language === "hi" ? "स्टार खगोलशास्त्री" : "Star Astronomer",
      desc: language === "hi" ? "सौर मंडल सिम्युलेटर की खोज की" : "Explored the Solaris space simulator.",
      icon: "⭐",
      color: "from-violet-500 via-indigo-500 to-purple-500",
      accent: "shadow-indigo-500/20",
    },
    {
      id: "Physiologist",
      name: language === "hi" ? "शरीर क्रिया विज्ञान शास्त्री" : "Physiologist",
      desc: language === "hi" ? "मानव शरीर रचना लैब का अध्ययन किया" : "Investigated the human body lab.",
      icon: "🫁",
      color: "from-rose-500 via-pink-500 to-red-500",
      accent: "shadow-pink-500/20",
    },
    {
      id: "Science Prodigy",
      name: language === "hi" ? "विज्ञान उस्ताद" : "Science Prodigy",
      desc: language === "hi" ? "स्तर 3 पर पहुंचने पर अनलॉक हुआ" : "Unlocked upon reaching Level 3.",
      icon: "🏆",
      color: "from-emerald-500 via-teal-500 to-green-400",
      accent: "shadow-teal-500/20",
    },
    {
      id: "STEAM Champ",
      name: language === "hi" ? "स्टीम चैंपियन" : "STEAM Champ",
      desc: language === "hi" ? "स्तर 5 पर पहुंचने पर सर्वोच्च सम्मान" : "Ultimate honor for reaching Level 5.",
      icon: "👑",
      color: "from-fuchsia-500 via-purple-500 to-pink-500",
      accent: "shadow-purple-500/20",
    },
    {
      id: "Robotics Engineer",
      name: language === "hi" ? "रोबोटिक्स इंजीनियर" : "Robotics Engineer",
      desc: language === "hi" ? "रोबोटिक्स लैब के तर्क को संकलित किया" : "Programmed the 3D robotic joint arm.",
      icon: "🤖",
      color: "from-purple-600 via-indigo-500 to-blue-500",
      accent: "shadow-indigo-500/20",
    },
    {
      id: "Molecular Chemist",
      name: language === "hi" ? "आणविक रसायन शास्त्री" : "Molecular Chemist",
      desc: language === "hi" ? "3डी अणु निर्माण व बांड विश्लेषण किया" : "Constructed structures in Molecular lab.",
      icon: "⚛️",
      color: "from-emerald-500 via-teal-400 to-cyan-500",
      accent: "shadow-teal-500/20",
    },
  ], [language]);

  const ENDPOINT = "/profile/me";

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const payload = await api.get(ENDPOINT);
      setData(payload || null);
    } catch (e) {
      setError(getApiError(e, t.err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t.err]);

  const onLogout = useCallback(() => {
    clearAuthTokens?.();
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const me = data?.user || {};
  const stats = data?.stats || {};
  const recent = data?.recent || {};

  const recentCourses = (recent.courses || []).map((c) => ({
    title: pickText(c?.title, language) || pickText(c?.courseTitle, language) || pickText(c?.name, language) || "Course",
    meta: c?.status ? `Status: ${pickText(c.status, language)}` : c?.assignedAt ? `Assigned: ${formatDate(c.assignedAt)}` : "",
  }));

  const recentMocks = (recent.mocks || []).map((m) => ({
    title: pickText(m?.title, language) || pickText(m?.name, language) || "Mock Test",
    meta: `Score: ${Number(m?.score ?? 0)}% • ${formatDate(m?.createdAt)}`,
  }));

  const recentProjects = (recent.projects || []).map((p) => ({
    title: pickText(p?.title, language) || pickText(p?.name, language) || "Project",
    meta: `${pickText(p?.status, language) || "—"} • ${formatDate(p?.createdAt)}`,
  }));

  const pageBg =
    theme === "dark"
      ? "bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(56,189,248,.18),transparent_60%),radial-gradient(900px_450px_at_80%_20%,rgba(232,121,249,.18),transparent_55%),radial-gradient(900px_450px_at_10%_70%,rgba(52,211,153,.14),transparent_55%),linear-gradient(to_bottom,#020617,#020617)] text-white"
      : "bg-[radial-gradient(1200px_600px_at_30%_0%,rgba(56,189,248,.20),transparent_60%),radial-gradient(900px_450px_at_80%_20%,rgba(232,121,249,.20),transparent_55%),radial-gradient(900px_450px_at_10%_70%,rgba(52,211,153,.18),transparent_55%),linear-gradient(to_bottom,#f8fafc,#f6f7ff)] text-slate-900";

  return (
    <div className={cn("min-h-screen", pageBg)}>
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.55, 0.8, 0.55], scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute -top-52 left-1/2 h-[780px] w-[780px] -translate-x-1/2 rounded-full blur-[170px]",
            theme === "dark" ? "bg-sky-500/10" : "bg-sky-400/25"
          )}
        />
        <motion.div
          animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className={cn(
            "absolute -bottom-64 right-[-200px] h-[820px] w-[820px] rounded-full blur-[190px]",
            theme === "dark" ? "bg-fuchsia-500/10" : "bg-fuchsia-400/22"
          )}
        />
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          className={cn(
            "absolute top-1/3 left-[-220px] h-[740px] w-[740px] rounded-full blur-[190px]",
            theme === "dark" ? "bg-emerald-500/8" : "bg-emerald-400/18"
          )}
        />
      </div>

      <main className="relative mx-auto w-full max-w-[1450px] px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-24 py-10">
        {/* header */}
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-4xl text-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              theme === "dark"
                ? "border-white/10 bg-white/5 text-white/80"
                : "border-black/10 bg-white/70 text-slate-700 shadow-[0_12px_30px_-22px_rgba(2,6,23,.4)]"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.kicker}</span>
          </div>

          <h1 className="mt-3 text-balance text-4xl font-black tracking-tight md:text-6xl">
            {t.titleA}{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-lime-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(52,211,153,0.45)]">
  {t.titleB}
</span>



          </h1>

          <p className={cn("mt-3 mx-auto max-w-2xl text-sm md:text-base", theme === "dark" ? "text-white/70" : "text-slate-700")}>
            {t.sub}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                theme === "dark" ? "bg-white/10 text-white/85 ring-white/15" : "bg-white/70 text-slate-800 ring-black/10"
              )}
            >
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              {t.joined}: {formatDate(me.createdAt)}
            </span>

            <motion.button
              type="button"
              onClick={fetchMe}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold border",
                theme === "dark" ? "border-white/10 bg-white/10 text-white/90" : "border-black/10 bg-white/75 text-slate-900"
              )}
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? "Loading..." : t.refresh}
            </motion.button>
          </div>
        </motion.section>

        {/* error */}
        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={cn(
                "mx-auto mt-4 max-w-3xl rounded-2xl border px-4 py-3 text-sm flex items-start gap-2 justify-center",
                theme === "dark" ? "border-rose-500/25 bg-rose-500/10 text-rose-200" : "border-rose-500/20 bg-rose-50 text-rose-700"
              )}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>{error}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* layout */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            {loading ? (
              <Glass theme={theme} className="h-[240px]" />
            ) : (
              <>
                {/* Student card */}
                <NeonCard theme={theme} tone="violet" className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 2, scale: 1.05 }}
                      transition={spring}
                      className={cn(
                        "relative h-16 w-16 overflow-hidden rounded-3xl border",
                        theme === "dark" ? "border-white/10 bg-white/5" : "border-black/5 bg-white/80"
                      )}
                    >
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-400/35 via-fuchsia-400/25 to-pink-400/25">
                        <UserIcon className={cn("h-7 w-7", theme === "dark" ? "text-white/90" : "text-slate-900")} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,.45)]" />
                    </motion.div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-black truncate">
                        {pickText(me.fullName, language) || pickText(me.name, language) || "—"}
                      </div>

                      <div className={cn("mt-1 text-sm font-semibold", theme === "dark" ? "text-white/75" : "text-slate-700")}>
                        {pickText(me.studentId, language) || "—"}
                      </div>

                      {/* ✅ Location removed */}
                      <div className="mt-4 space-y-2">
                        <InfoRow theme={theme} icon={<GraduationCap className="h-4 w-4" />} text={pickText(me.classLevel, language) || "—"} />
                        <InfoRow theme={theme} icon={<School className="h-4 w-4" />} text={pickText(me.schoolName, language) || pickText(me.school, language) || "—"} />
                        <InfoRow theme={theme} icon={<Mail className="h-4 w-4" />} text={pickText(me.email, language) || "—"} />
                        <InfoRow theme={theme} icon={<Phone className="h-4 w-4" />} text={pickText(me.phone, language) || "—"} />
                      </div>
                    </div>
                  </div>
                </NeonCard>

                {/* 3D Companion Avatar */}
                <NeonCard theme={theme} tone="violet" className="mt-4 p-5 flex flex-col items-center">
                  <div className="text-xs font-bold tracking-widest uppercase text-violet-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    {language === "hi" ? "3डी साथी" : "3D COMPANION"}
                  </div>
                  <ThreeAvatar level={gamification.level} theme={theme} />
                  <div className="text-xs text-center text-slate-400 mt-3 px-2 leading-relaxed">
                    {language === "hi" ? "आपका व्यक्तिगत रोबोट साथी। स्तर बढ़ने पर नई सज्जा अनलॉक होती है।" : "Your personal robot companion. Level up to unlock glowing rings and cosmetics!"}
                  </div>
                </NeonCard>

                {/* Gamification Stats (Level, XP, Coins) */}
                <NeonCard theme={theme} tone="sunset" className="mt-4 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-orange-400 uppercase">LEVEL {gamification.level}</div>
                      <div className="text-lg font-black mt-1">{language === "hi" ? "स्टीम स्तर" : "STEAM Level"}</div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-2xl border border-amber-500/20">
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-bold text-amber-300">{gamification.coins} Coins</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">XP Progress</span>
                      <span className="text-slate-300">{gamification.xp} / {gamification.maxXp} XP</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (gamification.xp / gamification.maxXp) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </NeonCard>

                {/* ✅ Quick Settings (under student card like screenshot) */}
                <QuickSettings
                  theme={theme}
                  language={language}
                  onToggleTheme={toggleTheme}
                  onToggleLanguage={toggleLanguage}
                  onLogout={onLogout}
                />
              </>
            )}
          </div>

          {/* Right */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <Glass theme={theme} className="p-6">
                <div className={cn("h-4 w-40 rounded", theme === "dark" ? "bg-white/10" : "bg-black/10")} />
                <div className={cn("mt-3 h-8 w-72 rounded", theme === "dark" ? "bg-white/10" : "bg-black/10")} />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={cn("h-20 rounded-2xl border", theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/70 border-black/5")} />
                  ))}
                </div>
              </Glass>
            ) : data ? (
              <NeonCard theme={theme} tone="ocean" className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-slate-600")}>{t.stats}</div>
                    <div className="mt-1 text-xl font-black">{t.summary}</div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                      theme === "dark" ? "bg-white/10 text-white/85 ring-white/15" : "bg-white/70 text-slate-800 ring-black/10"
                    )}
                  >
                    {t.live}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatPill theme={theme} accent="ocean" icon={<BookOpen className="h-5 w-5" />} label="Courses Assigned" value={stats.coursesAssigned ?? 0} />
                  <StatPill theme={theme} accent="mint" icon={<BookOpen className="h-5 w-5" />} label="Courses Completed" value={stats.coursesCompleted ?? 0} />
                  <StatPill theme={theme} accent="violet" icon={<Trophy className="h-5 w-5" />} label="Mock Attempts" value={stats.mockAttempts ?? 0} />
                  <StatPill theme={theme} accent="sunset" icon={<Trophy className="h-5 w-5" />} label="Avg Mock Score" value={`${stats.avgMockScore ?? 0}%`} />
                  <StatPill theme={theme} accent="ocean" icon={<Layers className="h-5 w-5" />} label="Projects" value={stats.projects ?? 0} />
                  <StatPill theme={theme} accent="mint" icon={<StickyNote className="h-5 w-5" />} label="Notes" value={stats.notes ?? 0} />
                  <StatPill theme={theme} accent="violet" icon={<Eye className="h-5 w-5" />} label="Activity Views" value={stats.activityViews ?? 0} />
                  <StatPill theme={theme} accent="sunset" icon={<Heart className="h-5 w-5" />} label="Activity Likes" value={stats.activityLikes ?? 0} />
                </div>
              </NeonCard>
            ) : null}

            {/* Achievements Showcase */}
            {!loading && data ? (
              <NeonCard theme={theme} tone="sunset" className="p-6">
                <div>
                  <div className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-slate-600")}>
                    {language === "hi" ? "मेरी उपलब्धियां" : "My Achievements"}
                  </div>
                  <div className="mt-1 text-xl font-black">
                    {language === "hi" ? "बैज और मेडल" : "Badges & Credentials"}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {badgesList.map((b) => {
                    const isUnlocked = gamification.badges.includes(b.id);
                    return (
                      <motion.div
                        key={b.id}
                        whileHover={isUnlocked ? { scale: 1.04, y: -4 } : {}}
                        className={cn(
                          "relative flex flex-col items-center text-center p-4 rounded-3xl border transition-all duration-300",
                          isUnlocked
                            ? theme === "dark"
                              ? "bg-white/5 border-white/10 shadow-lg"
                              : "bg-white/90 border-black/5 shadow-md"
                            : "opacity-45 bg-black/10 border-transparent pointer-events-none"
                        )}
                      >
                        {/* Badge Orb */}
                        <div
                          className={cn(
                            "relative w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-md",
                            isUnlocked
                              ? `bg-gradient-to-br ${b.color} text-white ${b.accent}`
                              : "bg-slate-700 text-slate-400"
                          )}
                        >
                          {isUnlocked ? b.icon : "🔒"}
                          {isUnlocked && (
                            <div className="absolute inset-0 rounded-full border border-white/30 animate-pulse" />
                          )}
                        </div>

                        <div className="mt-3 font-extrabold text-sm truncate w-full text-center">
                          {b.name}
                        </div>

                        <div className={cn("mt-1 text-[11px] leading-snug text-center", theme === "dark" ? "text-white/60" : "text-slate-500")}>
                          {b.desc}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </NeonCard>
            ) : null}

            {!loading && data ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <MiniList theme={theme} accent="mint" title={t.recCourses} items={recentCourses} empty="No recent courses." />
                </motion.div>
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <MiniList theme={theme} accent="violet" title={t.recMocks} items={recentMocks} empty="No mock attempts yet." />
                </motion.div>
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <MiniList theme={theme} accent="sunset" title={t.recProjects} items={recentProjects} empty="No projects yet." />
                </motion.div>
              </div>
            ) : null}

            {!loading && !data && !error ? (
              <Glass theme={theme} className={cn("p-6 text-sm", theme === "dark" ? "text-white/70" : "text-slate-700")}>
                No profile data found.
              </Glass>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
