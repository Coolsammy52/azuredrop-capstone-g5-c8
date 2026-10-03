-- Migration 001: shared_links table + supporting indexes.
-- Safe to re-run. `users` and `files` are created by src/config/schema.sql
-- (auth/upload feature) and are NOT created or altered here.
-- The shared_links definition below matches the one in schema.sql
-- (SERIAL id, INTEGER file_id), so whichever runs first, the result is the same.

CREATE TABLE IF NOT EXISTS shared_links (
  id           SERIAL PRIMARY KEY,
  file_id      INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  share_token  VARCHAR(255) UNIQUE NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_links_file_id ON shared_links (file_id);

-- Category filtering / search are always scoped to one user.
CREATE INDEX IF NOT EXISTS idx_files_user_category ON files (user_id, LOWER(category));
CREATE INDEX IF NOT EXISTS idx_files_user_uploaded ON files (user_id, uploaded_at DESC);
