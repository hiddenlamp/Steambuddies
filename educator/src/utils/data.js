// src/utils/data.js
// Shared static data & app-wide constants

// ─── App Metadata ─────────────────────────────────────────────────────────────
export const APP_NAME = "SteamBuddies";
export const APP_VERSION = "1.0.0";
export const SUPPORT_EMAIL = "support@steambuddies.com";

// ─── User Roles ───────────────────────────────────────────────────────────────
export const ROLES = {
  STUDENT:  "student",
  EDUCATOR: "educator",
  ADMIN:    "admin",
};

// ─── Languages ────────────────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "hi", label: "Hindi",      flag: "🇮🇳" },
  { code: "mr", label: "Marathi",    flag: "🇮🇳" },
  { code: "ta", label: "Tamil",      flag: "🇮🇳" },
  { code: "te", label: "Telugu",     flag: "🇮🇳" },
  { code: "kn", label: "Kannada",    flag: "🇮🇳" },
  { code: "gu", label: "Gujarati",   flag: "🇮🇳" },
  { code: "bn", label: "Bengali",    flag: "🇮🇳" },
];

// ─── Course Categories ────────────────────────────────────────────────────────
export const COURSE_CATEGORIES = [
  { id: "robotics",     label: "Robotics",      icon: "🤖" },
  { id: "coding",       label: "Coding",        icon: "💻" },
  { id: "electronics",  label: "Electronics",   icon: "⚡" },
  { id: "iot",          label: "IoT",           icon: "🌐" },
  { id: "3d-printing",  label: "3D Printing",   icon: "🖨️" },
  { id: "science",      label: "Science",       icon: "🔬" },
  { id: "maths",        label: "Mathematics",   icon: "📐" },
  { id: "ai-ml",        label: "AI & ML",       icon: "🧠" },
];

// ─── Difficulty Levels ────────────────────────────────────────────────────────
export const DIFFICULTY_LEVELS = [
  { value: "beginner",      label: "Beginner",      color: "#43e97b" },
  { value: "intermediate",  label: "Intermediate",  color: "#f7971e" },
  { value: "advanced",      label: "Advanced",      color: "#f64f59" },
];

// ─── Navigation Links (Student) ───────────────────────────────────────────────
export const STUDENT_NAV_LINKS = [
  { path: "/home",       label: "Home",      icon: "home" },
  { path: "/courses",    label: "Courses",   icon: "book-open" },
  { path: "/quest",      label: "Quest",     icon: "zap" },
  { path: "/profile",    label: "Profile",   icon: "user" },
];

// ─── Settings Sections ────────────────────────────────────────────────────────
export const SETTINGS_SECTIONS = [
  { id: "account",       label: "Account",         icon: "👤" },
  { id: "notifications", label: "Notifications",   icon: "🔔" },
  { id: "appearance",    label: "Appearance",      icon: "🎨" },
  { id: "language",      label: "Language",        icon: "🌐" },
  { id: "privacy",       label: "Privacy",         icon: "🔒" },
  { id: "about",         label: "About",           icon: "ℹ️"  },
];

// ─── API Base URL ─────────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL + "/api" : "https://steambuddies.onrender.com/api";

// ─── Local Storage Keys ───────────────────────────────────────────────────────
export const LS_KEYS = {
  USER:           "user",
  TOKEN:          "token",
  THEME:          "theme",
  LANGUAGE:       "language",
  ONBOARDING_DONE: "onboardingDone",
};
