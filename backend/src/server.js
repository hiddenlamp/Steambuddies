// src/server.js
// ✅ Production clean: Vercel serverless + Local Dev
// - Uses connectDB() from ./config/db.js
// - Prevents duplicate DB connects
// - Works in Vercel serverless + local node
// - Handles graceful shutdown in local dev

const { loadEnv } = require("./config/env");
loadEnv();

const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./config/db");

let connectPromise = null;

/**
 * Ensure MongoDB is connected (safe for serverless + hot reload)
 * mongoose.connection.readyState:
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
async function ensureDB() {
  const state = mongoose.connection.readyState;

  // already connected
  if (state === 1) return;

  // already connecting: wait for it
  if (state === 2 && connectPromise) {
    await connectPromise;
    return;
  }

  // start a fresh connect attempt
  connectPromise = connectDB()
    .then(() => true)
    .catch((err) => {
      connectPromise = null; // allow retry next time
      throw err;
    });

  await connectPromise;
}

/* ===================== VERCEL SERVERLESS HANDLER ===================== */
/**
 * Important:
 * - Do NOT create http server in serverless
 * - Just call express app(req,res)
 */
async function vercelHandler(req, res) {
  try {
    await ensureDB();
    return app(req, res);
  } catch (err) {
    console.error("❌ Vercel handler error:", err?.message || err);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ ok: false, message: "Server Error" }));
    }
  }
}

module.exports = vercelHandler;

/* ===================== LOCAL DEV / NORMAL NODE RUN ===================== */
if (require.main === module) {
  const PORT = Number(process.env.PORT || 5000);

  const server = http.createServer((req, res) => {
    // Small safety: ensure DB before handling requests in local mode too
    // (optional; you already connect before listen, but this protects against rare reconnects)
    ensureDB()
      .then(() => app(req, res))
      .catch((err) => {
        console.error("❌ Local request DB ensure error:", err?.message || err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, message: "DB Connection Error" }));
        }
      });
  });

  (async () => {
    try {
      await ensureDB();

      server.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🧠 Environment: ${process.env.NODE_ENV || "development"}`);
      });

      server.on("error", (err) => {
        console.error("❌ Server error:", err);
        process.exit(1);
      });
    } catch (err) {
      console.error("❌ Failed to start server:", err?.message || err);
      process.exit(1);
    }
  })();

  async function shutdown(signal) {
    console.log(`\n⚠️ Received ${signal}. Shutting down...`);

    try {
      // close HTTP server
      await new Promise((resolve) => server.close(resolve));
      console.log("🛑 HTTP server closed");

      // close DB connection
      try {
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
          await mongoose.connection.close();
          console.log("🛑 MongoDB connection closed");
        }
      } catch (e) {
        console.warn("⚠️ MongoDB close warning:", e?.message || e);
      }
    } finally {
      process.exit(0);
    }
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    shutdown("uncaughtException");
  });
}
