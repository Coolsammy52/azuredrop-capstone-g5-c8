-- Migration 001: shared_links table + supporting indexes.
-- Assumes `users` and `files` already exist (created by the auth/upload feature);
-- they are NOT created or altered here. Safe to re-run.

-- NOTE: the FK column types below must match files.id. UUID is assumed;
-- if files.id is SERIAL/INTEGER, change file_id to INTEGER (see docs/assumptions.md).
CREATE TABLE IF NOT EXISTS shared_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id      UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  share_token  VARCHAR(64) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_links_file_id ON shared_links (file_id);

-- Category filtering / search are always scoped to one user.
CREATE INDEX IF NOT EXISTS idx_files_user_category ON files (user_id, LOWER(category));
CREATE INDEX IF NOT EXISTS idx_files_user_uploaded ON files (user_id, uploaded_at DESC);
