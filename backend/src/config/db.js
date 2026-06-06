// ✅ src/config/db.js
// Clean + correct + production-safe
// - prevents duplicate connections (dev / hot reload)
// - logs connection events once
// - supports passing uri or using process.env.MONGO_URI
// - uses modern mongoose options

const mongoose = require("mongoose");

let listenersAttached = false;

async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI missing in .env");

  mongoose.set("strictQuery", true);

  // ✅ Already connected
  if (mongoose.connection.readyState === 1) {
    // 1 = connected
    // console.log("✅ MongoDB already connected");
    return mongoose.connection;
  }

  // ✅ Connecting in progress (reuse same connection promise)
  if (mongoose.connection.readyState === 2) {
    // 2 = connecting
    return mongoose.connection;
  }

  // Attach listeners only once (prevents duplicate logs in dev)
  if (!listenersAttached) {
    listenersAttached = true;

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err?.message || err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    // Optional: close connection on process exit
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🛑 MongoDB connection closed (SIGINT)");
        process.exit(0);
      } catch (e) {
        console.error("❌ MongoDB close error:", e?.message || e);
        process.exit(1);
      }
    });
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      // bufferCommands: false, // optional: fail fast if DB is down
    });

    return mongoose.connection;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err?.message || err);
    throw err;
  }
}

module.exports = { connectDB };
