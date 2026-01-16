const { createTransporter } = require("../config/mailer");

async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
