/** Delete a file: removes the blob from Azure storage, then the database row. */
const pool = require('../config/db');
const { containerClient, containerName } = require('../config/azureStorage');
const fileModel = require('../models/fileModel');
const { HttpError, asyncHandler } = require('../utils/http');

/**
 * DELETE /files/:id   (auth, owner only)
 *
 * Order matters: the blob goes first. If storage fails we stop and keep the row, so the
 * user can retry and no database record ever points at a file we failed to remove. Deleting
 * the row afterwards also removes its share links (shared_links.file_id is ON DELETE CASCADE),
 * so any link to this file stops working at once.
 *
 * 204 deleted, 404 not found / not yours, 500 storage or database failure.
 */
exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await fileModel.findOwnedById(req.params.id, req.user.id);
  if (!file) throw new HttpError(404, 'File not found');

  // The blob name is the part of file_url after the container name (same rule as download).
  const prefix = `/${containerName}/`;
  const blobUrl = new URL(file.file_url);
  if (!blobUrl.pathname.startsWith(prefix)) {
    throw new HttpError(500, 'Invalid file storage path');
  }
  const blobName = decodeURIComponent(blobUrl.pathname.slice(prefix.length));

  try {
    // A blob that is already gone (404) should not block removing the record.
    await containerClient.deleteBlob(blobName, { deleteSnapshots: 'include' }).catch((err) => {
      if (err.statusCode === 404) return;
      throw err;
    });
  } catch (err) {
    console.error('Blob delete failed:', err.message);
    throw new HttpError(500, 'File delete failed');
  }

  // user_id in the WHERE clause is a second guard on top of the ownership check above.
  await pool.query('DELETE FROM files WHERE id = $1 AND user_id = $2', [file.id, req.user.id]);
  res.status(204).end();
});
