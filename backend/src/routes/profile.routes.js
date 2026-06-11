const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware"); // aapka existing
const { getMyProfile } = require("../controllers/profile.controller");

router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, require("../controllers/profile.controller").updateProfile);

module.exports = router;
