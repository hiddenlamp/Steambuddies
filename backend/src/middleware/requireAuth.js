const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized: token missing",
      });
    }

    const token = authHeader.slice(7).trim(); // "Bearer ".length = 7
    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized: token missing",
      });
    }

    // ✅ EXACT same secret fallback chain as generateTokens.js
    const secret =
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET ||
      "dev_access_secret";

    const decoded = jwt.verify(token, secret);

    // ✅ payload expected: { sub, role }
    req.user = {
      id: decoded.sub || decoded.id || decoded._id,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.name, err.message);

    return res.status(401).json({
      ok: false,
      message:
        err.name === "TokenExpiredError"
          ? "Unauthorized: token expired"
          : "Unauthorized: invalid token",
    });
  }
};
