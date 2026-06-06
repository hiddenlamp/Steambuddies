const nodemailer = require("nodemailer");

function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendResetEmail({ to, name, link }) {
  const transporter = makeTransporter();

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>Password Reset</h2>
    <p>Hi ${name || "there"},</p>
    <p>You requested to reset your password. Click the button below:</p>
    <p>
      <a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block">
        Reset Password
      </a>
    </p>
    <p>If you didn’t request this, ignore this email.</p>
    <p style="color:#777;font-size:12px">This link will expire soon.</p>
  </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Reset your password",
    html,
  });
}

module.exports = { sendResetEmail };
