/** Feature 4 - File metadata. */
const fileModel = require('../models/fileModel');
const { HttpError, asyncHandler } = require('../utils/http');

/** GET /files/:id/metadata - full metadata for one of the caller's files. */
exports.getMetadata = asyncHandler(async (req, res) => {
  const file = await fileModel.findOwnedById(req.params.id, req.user.id);
  // 404 (not 403) for other users' files so IDs can't be probed.
  if (!file) throw new HttpError(404, 'File not found');
  res.json({ file: fileModel.toMetadata(file) });
});
