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

async function sendLeaveEmailToAdmin({ educatorName, startDate, endDate, reason }) {
  const transporter = makeTransporter();

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>New Leave Application</h2>
    <p>Hi Admin,</p>
    <p>Educator <strong>${educatorName}</strong> has applied for leave.</p>
    <ul>
      <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
      <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
      <li><strong>Reason:</strong> ${reason}</li>
    </ul>
    <p>Please log in to the admin dashboard to approve or reject this request.</p>
  </div>
  `;

  // Sending to the admin email, which is the same as SMTP_USER for now
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.SMTP_USER,
    subject: `Leave Request from ${educatorName}`,
    html,
  });
}

module.exports = { sendResetEmail, sendLeaveEmailToAdmin };
