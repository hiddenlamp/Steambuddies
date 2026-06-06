const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const user = require("../controllers/user.controller");

router.get("/me", requireAuth, user.me);

module.exports = router;
