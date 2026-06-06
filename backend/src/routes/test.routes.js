// routes/test.routes.js
const router = require("express").Router();
const { sendMail } = require("../services/mail.service");

router.get("/test-mail", async (req, res) => {
  await sendMail({
    to: "rk1054055@gmail.com",
    subject: "Test Mail",
    html: "<h2>Test OK</h2>",
  });
  res.json({ ok: true });
});

module.exports = router;
