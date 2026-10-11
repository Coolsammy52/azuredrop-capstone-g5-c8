-- Migration 002: one-time tokens for "forgot password".
-- Only a SHA-256 hash of the token is stored, never the token itself.
-- Safe to re-run. Requires the users table (src/config/schema.sql).

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens (user_id);
