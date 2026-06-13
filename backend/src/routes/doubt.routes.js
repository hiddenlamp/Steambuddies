const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { createDoubt, getDoubts, getDoubtById, addMessage, markResolved, markSeen } = require("../controllers/doubt.controller");

router.use(requireAuth);

router.post("/", createDoubt);
router.get("/", getDoubts);
router.get("/:id", getDoubtById);
router.post("/:id/messages", addMessage);
router.patch("/:id/resolve", markResolved);
router.patch("/:id/seen", markSeen);

module.exports = router;
