// src/server.js

// ✅ MUST be first (before app import)
const { loadEnv } = require("./config/env");
loadEnv();

const app = require("./app");
const { connectDB } = require("./config/db");

let isDbConnected = false;

async function ensureDB() {
  if (isDbConnected) return;
  await connectDB();
  isDbConnected = true;
  console.log("✅ Database connected");
}

/**
 * ✅ Vercel serverless handler:
 * - Called on every request
 * - DB connects once and reused
 */
module.exports = async (req, res) => {
  try {
    await ensureDB();
    return app(req, res);
  } catch (err) {
    console.error("❌ Handler error:", err);
    return res.status(500).send("Server Error");
  }
};

// ✅ Local dev / normal Node run (node src/server.js)
if (require.main === module) {
  const PORT = Number(process.env.PORT || 5000);
  let server;

  (async () => {
    try {
      await ensureDB();

      server = app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🧠 Environment: ${process.env.NODE_ENV || "development"}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`❌ Port ${PORT} is already in use.`);
        } else {
          console.error("❌ Server error:", err);
        }
        process.exit(1);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  })();

  async function shutdown(signal) {
    console.log(`\n⚠️ Received ${signal}. Shutting down...`);
    try {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
        console.log("🛑 HTTP server closed");
      }
    } catch (e) {
      console.error("❌ Error during shutdown:", e);
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
