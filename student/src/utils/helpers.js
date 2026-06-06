// src/utils/helpers.js
// Shared utility / helper functions

// ─── Date & Time ────────────────────────────────────────────────────────────

/** Format ISO date string to "DD MMM YYYY" e.g. "26 May 2025" */
export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Get relative time e.g. "2 hours ago", "just now" */
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── String Utils ────────────────────────────────────────────────────────────

/** Capitalize first letter of each word */
export function titleCase(str) {
  if (!str) return "";
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** Truncate text to maxLength with ellipsis */
export function truncate(text, maxLength = 100) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

/** Slugify a string: "Hello World" → "hello-world" */
export function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

// ─── Number Utils ─────────────────────────────────────────────────────────────

/** Format number with suffix: 1500 → "1.5K", 1000000 → "1M" */
export function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Clamp a value between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ─── Local Storage ────────────────────────────────────────────────────────────

/** Safely get JSON from localStorage */
export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Safely set JSON in localStorage */
export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail (e.g. private mode / storage full)
  }
}

/** Remove a key from localStorage */
export function lsRemove(key) {
  localStorage.removeItem(key);
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Basic email validation */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Check if a string is empty or whitespace only */
export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

// ─── Array Utils ──────────────────────────────────────────────────────────────

/** Group an array of objects by a key */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

/** Shuffle an array (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
