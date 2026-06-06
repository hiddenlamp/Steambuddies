const jwt = require("jsonwebtoken");

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev_access_secret";
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_refresh_secret";
}

function getAccessExpires() {
  return (
    process.env.JWT_ACCESS_EXPIRES ||
    process.env.ACCESS_TOKEN_EXPIRES_IN ||
    process.env.ACCESS_TOKEN_EXPIRES ||
    "1d"
  );
}

function getRefreshExpires() {
  return (
    process.env.JWT_REFRESH_EXPIRES ||
    process.env.REFRESH_TOKEN_EXPIRES_IN ||
    process.env.REFRESH_TOKEN_EXPIRES ||
    "7d"
  );
}

function generateAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: getAccessExpires() });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: getRefreshExpires() });
}

module.exports = { generateAccessToken, generateRefreshToken };
