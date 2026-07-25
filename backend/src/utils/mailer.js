const nodemailer = require('nodemailer');

// Falls back to nodemailer's JSON transport when no SMTP host is
// configured, so email-sending code paths still run end-to-end (and are
// testable) without ever touching the network or requiring real
// credentials. Configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/EMAIL_FROM
// to actually deliver mail.
function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransporter();
const FROM = process.env.EMAIL_FROM || 'NovaMax ERP <no-reply@novamaxpharma.com>';

async function sendMail({ to, subject, html }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return null;

  try {
    const info = await transporter.sendMail({ from: FROM, to: recipients.join(','), subject, html });
    if (!process.env.SMTP_HOST) {
      console.log(`[mailer] SMTP not configured - composed but did not send: "${subject}" to ${recipients.join(', ')}`);
    }
    return info;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return null;
  }
}

module.exports = { sendMail };
