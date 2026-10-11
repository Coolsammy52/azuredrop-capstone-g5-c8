/**
 * Sends email through SMTP when SMTP_HOST is set (env vars only, no secrets in code).
 * Without SMTP the message is printed to the server console, so password reset
 * can be tried locally. Do not rely on the console fallback in production.
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined
    })
    : null;

async function sendMail({ to, subject, text }) {
    if (!transporter) {
        console.log(`[mail not configured] To: ${to}\nSubject: ${subject}\n${text}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text
    });
}

module.exports = { sendMail };
