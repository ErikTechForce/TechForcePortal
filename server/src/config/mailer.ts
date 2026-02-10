import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'noreply@techforcerobotics.com';

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email not sent: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
    return;
  }
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: 'Verify your TechForce Portal email',
      text: `Please verify your email by opening this link in your browser:\n\n${verificationLink}\n\nIf you did not create an account, you can ignore this email.`,
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>If you did not create an account, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send verification email:', err);
    throw err;
  }
}
