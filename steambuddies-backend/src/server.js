// ✅ MUST be first (before app import)
const { loadEnv } = require("./config/env");
loadEnv();

const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

let server;

async function startServer() {
  try {
    await connectDB();
    console.log("✅ Database connected");

    server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🧠 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (err) => {
      // common: port already in use
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
}

async function shutdown(signal) {
  console.log(`\n⚠️ Received ${signal}. Shutting down...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("🛑 HTTP server closed");
    }

    // ✅ OPTIONAL (recommended): if your connectDB uses mongoose, close it
    // const mongoose = require("mongoose");
    // if (mongoose.connection?.readyState === 1) {
    //   await mongoose.connection.close();
    //   console.log("🛑 DB connection closed");
    // }
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

startServer();
