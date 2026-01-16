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
const notesRoutes = require("./routes/notes.routes");

const app = express();

/** ============ Core middleware ============ */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // keep off unless you configure CSP properly
    contentSecurityPolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
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
    // allow server-to-server/curl/mobile apps
    if (!origin) return callback(null, true);
    if (finalAllowed.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Cookie",
  ],
};

app.use(cors(corsOptions));
// ✅ safer than "*"
app.options(/.*/, cors(corsOptions));

/** ============ Static uploads ============ */
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
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

/** ============ Root + Health ============ */
app.get("/", (req, res) => {
  res.status(200).send("SteamBuddies Backend Running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "SteamBuddies API is healthy ✅" });
});

/** ============ Routes ============ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/notes", notesRoutes);

/** ============ 404 + error handler ============ */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
