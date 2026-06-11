const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { createDoubt, getDoubts, getDoubtById, addMessage, markResolved } = require("../controllers/doubt.controller");

router.use(requireAuth);

router.post("/", createDoubt);
router.get("/", getDoubts);
router.get("/:id", getDoubtById);
router.post("/:id/messages", addMessage);
router.patch("/:id/resolve", markResolved);

module.exports = router;
