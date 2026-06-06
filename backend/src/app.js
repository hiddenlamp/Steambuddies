// src/app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { errorHandler, notFound } = require("./middleware/error.middleware.js");

// routes
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const courseRoutes = require("./routes/courses.routes.js");
const activitiesRoutes = require("./routes/activities.routes.js");
const notesRoutes = require("./routes/notes.routes.js");
const studentRoutes = require("./routes/student/student.routes.js");
const educatorRoutes = require("./routes/educatorRoutes.js");
const adminRoutes = require("./routes/admin.routes.js");

const manualsRoutes = require("./routes/manuals.routes.js");
const projectsRoutes = require("./routes/projects.routes.js");
const profileRoutes = require("./routes/profile.routes.js");

// educator / student extra routes
const educatorSchoolsRoutes = require("./routes/educator/educator.schools.routes.js");
const educatorAssignmentsRoutes = require("./routes/educator/educator.assignments.routes.js");
const educatorManualAssignRoutes = require("./routes/educator/educator.manualAssignments.routes.js");
const educatorProjectAssignmentsRoutes = require("./routes/educator/educator.projectAssignments.routes.js");
const studentManualsRoutes = require("./routes/student/student.manuals.routes.js");

// optional test
const testRoutes = require("./routes/test.routes.js");

const notificationsRoutes = require("./routes/notifications.routes.js");

const app = express();
app.set("trust proxy", 1);

const NODE_ENV = process.env.NODE_ENV || "development";

/** =========================
 * CORS
 * ========================= */
const envOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const devFallback = [
  "http://localhost:5173", "http://127.0.0.1:5173",
  "http://localhost:5174", "http://127.0.0.1:5174",
  "http://localhost:5175", "http://127.0.0.1:5175"
];

const allowedOrigins = [...new Set([...envOrigins, ...devFallback])]
  .map((o) => String(o).replace(/\/+$/, ""))
  .filter(Boolean);

const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "Accept",
  "Origin",
  "X-Requested-With",
  "Cache-Control",
  "Pragma",
  "x-access-token",
  "X-Access-Token",
];

const corsOptions =
  NODE_ENV === "production"
    ? {
        origin(origin, cb) {
          if (!origin) return cb(null, true);
          const clean = String(origin).replace(/\/+$/, "");
          if (allowedOrigins.includes(clean)) return cb(null, true);
          return cb(new Error(`CORS blocked for origin: ${clean}`), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ALLOWED_HEADERS,
        maxAge: 86400,
      }
    : {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ALLOWED_HEADERS,
        maxAge: 86400,
      };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/** =========================
 * Security + Parsers
 * ========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

/** =========================
 * Uploads (static)
 * ========================= */
app.use("/uploads", (req, res, next) => {
  const origin = req.headers.origin ? String(req.headers.origin).replace(/\/+$/, "") : "";
  res.setHeader("Vary", "Origin");

  if (NODE_ENV !== "production") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/** =========================
 * Rate limit
 * ========================= */
app.use(
  "/api",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/** =========================
 * Health
 * ========================= */
app.get("/", (req, res) => res.status(200).send("SteamBuddies Backend Running ✅"));
app.get("/api/health", (req, res) =>
  res.json({ ok: true, env: NODE_ENV, time: new Date().toISOString() })
);

/** =========================
 * API mounts
 * ========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/courses", courseRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/notes", notesRoutes);

app.use("/api/student", studentRoutes);
app.use("/api/student", studentManualsRoutes);

app.use("/api/educator", educatorRoutes);
app.use("/api/educator", educatorSchoolsRoutes);
app.use("/api/educator", educatorAssignmentsRoutes);
app.use("/api/educator", educatorManualAssignRoutes);

app.use("/api/manuals", manualsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/educator", educatorProjectAssignmentsRoutes);
app.use("/api/profile", profileRoutes);

// Admin
app.use("/api/admin", adminRoutes);

app.use("/api/test", testRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/events", require("./routes/events.routes.js"));
app.use("/api/reports", require("./routes/reports.routes.js"));

/** =========================
 * 404 + Error handler
 * ========================= */
app.use(notFound);
app.use(errorHandler);

module.exports = app;