/**
 * Queries against the existing `files` table (owned by the upload feature).
 * This module never creates or alters that table; it only reads it and
 * updates files.category.
 *
 * `toMetadata` is THE canonical metadata shape - reuse it in any list/detail
 * endpoint so every response looks the same.
 */
const pool = require('../config/db');

// Columns every metadata query must select (f = files, u = users).
const METADATA_COLUMNS = `
  f.id, f.user_id, f.filename, f.file_type, f.file_size, f.category,
  f.file_url, f.uploaded_at, u.name AS uploader_name`;

/** Map a joined row to the public metadata object. Never exposes email/password. */
function toMetadata(row) {
  return {
    id: row.id,
    filename: row.filename,
    file_type: row.file_type,
    file_size: row.file_size === null ? null : Number(row.file_size), // BIGINT arrives as string
    category: row.category,
    file_url: row.file_url,
    uploaded_at: row.uploaded_at,
    uploader: { id: row.user_id, name: row.uploader_name },
  };
}

/** One file owned by userId, or null (also null if it belongs to someone else). */
async function findOwnedById(fileId, userId) {
  const { rows } = await pool.query(
    `SELECT ${METADATA_COLUMNS}
       FROM files f JOIN users u ON u.id = f.user_id
      WHERE f.id = $1 AND f.user_id = $2`,
    [fileId, userId]
  );
  return rows[0] || null;
}

async function updateCategory(fileId, userId, category) {
  const { rowCount } = await pool.query(
    'UPDATE files SET category = $3 WHERE id = $1 AND user_id = $2',
    [fileId, userId, category]
  );
  return rowCount > 0;
}

/**
 * Search/list the caller's files.
 * @param {object} p
 * @param {string|number} p.userId
 * @param {string} [p.query]    case-insensitive substring match on filename
 * @param {string} [p.category] case-insensitive exact match on category
 * @param {number} p.limit
 * @param {number} p.offset
 * @returns {Promise<{rows: object[], total: number}>}
 */
async function search({ userId, query, category, limit, offset }) {
  const params = [userId];
  const where = ['f.user_id = $1'];

  if (query) {
    // Escape LIKE wildcards so user input is matched literally.
    params.push(`%${query.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`f.filename ILIKE $${params.length}`);
  }
  if (category) {
    params.push(category);
    where.push(`LOWER(f.category) = LOWER($${params.length})`);
  }
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT ${METADATA_COLUMNS}, COUNT(*) OVER() AS total_count
       FROM files f JOIN users u ON u.id = f.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY f.uploaded_at DESC, f.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

/** Distinct categories the caller uses, with file counts. Uncategorised files are skipped. */
async function listCategories(userId) {
  const { rows } = await pool.query(
    `SELECT category, COUNT(*)::int AS file_count
       FROM files
      WHERE user_id = $1 AND category IS NOT NULL AND category <> ''
      GROUP BY category
      ORDER BY category`,
    [userId]
  );
  return rows;
}

module.exports = { toMetadata, findOwnedById, updateCategory, search, listCategories };
