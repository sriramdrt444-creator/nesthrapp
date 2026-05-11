import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const otpStore = globalThis.__nesthrOtpStore || new Map();
globalThis.__nesthrOtpStore = otpStore;

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const cleanupOtps = () => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt <= now) {
      otpStore.delete(key);
    }
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!emailUser || !emailPass) {
    throw new Error('SMTP credentials are not configured.');
  }

  return transporter.sendMail({
    from: emailUser,
    to,
    subject,
    text,
    html,
  });
};

app.post('/api/send-otp', async (req, res) => {
  cleanupOtps();

  const { email, purpose = 'verification' } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const otp = createOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(`${email}:${purpose}`, { otp, expiresAt });

  const subject = purpose === 'forgot_password' ? 'Your password reset OTP' : 'Your email verification OTP';
  const text = `Your OTP code is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`;

  try {
    await sendEmail({ to: email, subject, text, html });
    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return res.status(500).json({ success: false, error: 'Unable to send OTP email' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  cleanupOtps();

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const otp = createOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(`${email}:forgot_password`, { otp, expiresAt });

  const subject = 'Password reset OTP';
  const text = `Your password reset OTP is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`;

  try {
    await sendEmail({ to: email, subject, text, html });
    return res.json({ success: true, message: 'Forgot password OTP sent successfully' });
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return res.status(500).json({ success: false, error: 'Unable to send reset email' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  cleanupOtps();

  const { email, purpose = 'verification', otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });
  }

  const stored = otpStore.get(`${email}:${purpose}`);
  if (!stored || stored.expiresAt <= Date.now()) {
    otpStore.delete(`${email}:${purpose}`);
    return res.status(400).json({ success: false, error: 'OTP not found or expired' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, error: 'OTP is invalid' });
  }

  otpStore.delete(`${email}:${purpose}`);
  return res.json({ success: true, message: 'OTP verified successfully' });
});

export default app;
