/** Forgot password / reset password. Tokens live in password_reset_tokens (migration 002). */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sendMail } = require("../utils/mailer");

const TOKEN_TTL_MINUTES = 30;

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

/**
 * POST /auth/forgot-password   body: { email }
 * Always answers the same way, so nobody can find out which emails are registered.
 */
async function forgotPassword(req, res) {
    const genericReply = {
        message: "If that email is registered, a password reset link has been sent"
    };

    try {
        const { email } = req.body || {};

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await pool.query(
            "SELECT id, email FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

            // Only the newest link should work.
            await pool.query(
                "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL",
                [user.id]
            );
            await pool.query(
                `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                 VALUES ($1, $2, $3)`,
                [user.id, hashToken(token), expiresAt]
            );

            const base = process.env.FRONTEND_URL || "http://localhost:3000";
            await sendMail({
                to: user.email,
                subject: "Reset your AzureDrop password",
                text:
                    `Use this link to choose a new password (valid for ${TOKEN_TTL_MINUTES} minutes):\n\n` +
                    `${base}/reset-password?token=${token}\n\n` +
                    "If you did not ask for this, you can ignore this email."
            });
        }

        return res.json(genericReply);
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

/** POST /auth/reset-password   body: { token, password } */
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body || {};

        if (!token || !password || typeof token !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: "Token and new password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long"
            });
        }

        const found = await pool.query(
            `SELECT id, user_id FROM password_reset_tokens
              WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
            [hashToken(token)]
        );

        if (found.rows.length === 0) {
            return res.status(400).json({ error: "Reset link is invalid or has expired" });
        }

        const { id: tokenId, user_id: userId } = found.rows[0];
        const passwordHash = await bcrypt.hash(password, 12);

        // Mark the token used first, and only continue if this request was the one that used it.
        const claimed = await pool.query(
            "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1 AND used_at IS NULL",
            [tokenId]
        );
        if (claimed.rowCount === 0) {
            return res.status(400).json({ error: "Reset link is invalid or has expired" });
        }

        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
            passwordHash,
            userId
        ]);

        return res.json({ message: "Password updated. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = { forgotPassword, resetPassword };
