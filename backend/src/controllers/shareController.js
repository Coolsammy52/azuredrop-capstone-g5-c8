/** Feature 3 - Temporary file-sharing links. */
const fileModel = require('../models/fileModel');
const shareModel = require('../models/shareModel');
const azureBlob = require('../config/azureBlob');
const { HttpError, asyncHandler } = require('../utils/http');

const DEFAULT_MINUTES = parseInt(process.env.SHARE_DEFAULT_EXPIRY_MINUTES, 10) || 60;
const MAX_MINUTES = parseInt(process.env.SHARE_MAX_EXPIRY_MINUTES, 10) || 10080; // 7 days
const DOWNLOAD_URL_TTL_MS = 10 * 60 * 1000; // SAS URLs live at most 10 minutes

/** POST /files/:id/share   body: { "expires_in_minutes": 60 }  (auth, owner only) */
exports.createShareLink = asyncHandler(async (req, res) => {
  const minutes = req.body?.expires_in_minutes ?? DEFAULT_MINUTES;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    throw new HttpError(400, `expires_in_minutes must be an integer between 1 and ${MAX_MINUTES}`);
  }

  const file = await fileModel.findOwnedById(req.params.id, req.user.id);
  if (!file) throw new HttpError(404, 'File not found');

  const link = await shareModel.create(file.id, new Date(Date.now() + minutes * 60 * 1000));
  res.status(201).json({
    share_token: link.share_token,
    share_path: `/share/${link.share_token}`,
    expires_at: link.expires_at,
    created_at: link.created_at,
    file_id: link.file_id,
  });
});

/** GET /files/:id/shares - links created for one of the caller's files. */
exports.listShareLinks = asyncHandler(async (req, res) => {
  const file = await fileModel.findOwnedById(req.params.id, req.user.id);
  if (!file) throw new HttpError(404, 'File not found');

  const links = await shareModel.listForFile(file.id, req.user.id);
  const now = Date.now();
  res.json({
    shares: links.map((l) => ({ ...l, expired: new Date(l.expires_at).getTime() <= now })),
  });
});

/** DELETE /shares/:token - revoke a link early (auth, owner only). */
exports.revokeShareLink = asyncHandler(async (req, res) => {
  const removed = await shareModel.revoke(req.params.token, req.user.id);
  if (!removed) throw new HttpError(404, 'Share link not found');
  res.status(204).end();
});

/**
 * GET /share/:token            PUBLIC - no login.
 * GET /share/:token?redirect=1 same, but 302-redirects straight to the download.
 *
 * 404 unknown token, 410 expired. Never reveals the uploader or the raw blob URL.
 */
exports.accessSharedFile = asyncHandler(async (req, res) => {
  const link = await shareModel.findByTokenWithFile(req.params.token);
  if (!link) throw new HttpError(404, 'Share link not found');

  const expiresAt = new Date(link.expires_at);
  if (expiresAt.getTime() <= Date.now()) {
    throw new HttpError(410, 'This share link has expired');
  }

  // The download URL never outlives the share link itself.
  const urlExpiresAt = new Date(Math.min(expiresAt.getTime(), Date.now() + DOWNLOAD_URL_TTL_MS));

  let downloadUrl;
  if (azureBlob.isConfigured()) {
    downloadUrl = await azureBlob.generateReadUrl(link.file_url, urlExpiresAt, link.filename);
  } else {
    // Local dev without Azure credentials: fall back to the stored URL.
    console.warn('AZURE_STORAGE_CONNECTION_STRING not set - returning raw file_url');
    downloadUrl = link.file_url;
  }

  if (req.query.redirect) return res.redirect(302, downloadUrl);

  res.json({
    file: {
      id: link.file_id,
      filename: link.filename,
      file_type: link.file_type,
      file_size: link.file_size === null ? null : Number(link.file_size),
      category: link.category,
      uploaded_at: link.uploaded_at,
    },
    download_url: downloadUrl,
    download_url_expires_at: urlExpiresAt,
    share_expires_at: expiresAt,
  });
});
