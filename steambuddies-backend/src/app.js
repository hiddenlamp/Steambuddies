// src/app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { errorHandler, notFound } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/courses.routes");
const activitiesRoutes = require("./routes/activities.routes");

// ✅ NEW: notes routes
const notesRoutes = require("./routes/notes.routes");

const app = express();

/** ============ Core middleware ============ */
// ✅ IMPORTANT: allow cross-origin images/videos/files from this server
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Optional hardening (safe defaults)
    contentSecurityPolicy: false, // keep off unless you configure CSP properly
  })
);

app.use(express.json({ limit: "10mb" })); // notes meta + other payloads
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/** ============ CORS ============ */
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const devFallback = ["http://localhost:5173", "http://127.0.0.1:5173"];
const finalAllowed = [...new Set([...allowedOrigins, ...devFallback])];

const corsOptions = {
  origin(origin, callback) {
    // allow mobile apps / server-to-server / curl
    if (!origin) return callback(null, true);
    if (finalAllowed.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/** ============ Static uploads (IMPORTANT) ============ */
/**
 * ✅ Your app already serves /uploads
 * For Notes PDF download, we will use:
 * - direct static:   /uploads/<filename>  (optional)
 * - secure endpoint: /api/notes/download/:id  (recommended)
 */
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // PDFs are often opened in new tab; this helps
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

/** ============ Rate limiting ============ */
app.use(
  "/api",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/** ============ Health ============ */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "SteamBuddies API is healthy ✅" });
});

/** ============ Routes ============ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/activities", activitiesRoutes);

// ✅ NOTES (Educator upload + Student list + Download)
app.use("/api/notes", notesRoutes);

/** ============ 404 + error handler ============ */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
