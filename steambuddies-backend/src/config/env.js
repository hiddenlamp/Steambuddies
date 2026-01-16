const dotenv = require("dotenv");

function loadEnv() {
  dotenv.config();
  const required = [
    "MONGO_URI",
    "CLIENT_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "MAIL_FROM",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn("⚠️ Missing ENV keys:", missing.join(", "));
  }
}

module.exports = { loadEnv };
