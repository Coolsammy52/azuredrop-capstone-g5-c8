/** Queries against the `shared_links` table (created by migrations/001). */
const crypto = require('crypto');
const pool = require('../config/db');

/** 256-bit random, URL-safe token (43 chars). Unguessable; stored as-is in share_token. */
const generateToken = () => crypto.randomBytes(32).toString('base64url');

async function create(fileId, expiresAt) {
  const { rows } = await pool.query(
    `INSERT INTO shared_links (file_id, share_token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, file_id, share_token, expires_at, created_at`,
    [fileId, generateToken(), expiresAt]
  );
  return rows[0];
}

/** Link + the file it points at (public view - no uploader details). */
async function findByTokenWithFile(token) {
  const { rows } = await pool.query(
    `SELECT s.share_token, s.expires_at,
            f.id AS file_id, f.filename, f.file_type, f.file_size,
            f.category, f.file_url, f.uploaded_at
       FROM shared_links s JOIN files f ON f.id = s.file_id
      WHERE s.share_token = $1`,
    [token]
  );
  return rows[0] || null;
}

/** All links for a file the caller owns (newest first). */
async function listForFile(fileId, userId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.file_id, s.share_token, s.expires_at, s.created_at
       FROM shared_links s JOIN files f ON f.id = s.file_id
      WHERE s.file_id = $1 AND f.user_id = $2
      ORDER BY s.created_at DESC`,
    [fileId, userId]
  );
  return rows;
}

/** Delete a link, only if the caller owns the underlying file. */
async function revoke(token, userId) {
  const { rowCount } = await pool.query(
    `DELETE FROM shared_links s USING files f
      WHERE s.share_token = $1 AND f.id = s.file_id AND f.user_id = $2`,
    [token, userId]
  );
  return rowCount > 0;
}

module.exports = { create, findByTokenWithFile, listForFile, revoke };
