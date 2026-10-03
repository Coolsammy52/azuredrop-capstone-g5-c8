/** Feature 1 - File categories. */
const fileModel = require('../models/fileModel');
const { HttpError, asyncHandler } = require('../utils/http');
const { parsePaging, pagedResponse } = require('./searchController');

const MAX_CATEGORY_LENGTH = 50;

/** PATCH /files/:id/category   body: { "category": "invoices" }  (null or "" clears it) */
exports.setCategory = asyncHandler(async (req, res) => {
  const { category } = req.body || {};
  if (category !== null && category !== undefined && typeof category !== 'string') {
    throw new HttpError(400, 'category must be a string or null');
  }

  const value = category ? category.trim() : '';
  if (value.length > MAX_CATEGORY_LENGTH) {
    throw new HttpError(400, `category must be at most ${MAX_CATEGORY_LENGTH} characters`);
  }
  if (category === undefined) throw new HttpError(400, 'category is required');

  const updated = await fileModel.updateCategory(req.params.id, req.user.id, value || null);
  if (!updated) throw new HttpError(404, 'File not found');

  const file = await fileModel.findOwnedById(req.params.id, req.user.id);
  res.json({ file: fileModel.toMetadata(file) });
});

/** GET /files/categories - the caller's categories with counts. */
exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await fileModel.listCategories(req.user.id);
  res.json({ categories });
});

/** GET /files/category/:category?page=&limit= - the caller's files in one category. */
exports.listFilesByCategory = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query);
  const result = await fileModel.search({
    userId: req.user.id,
    category: req.params.category.trim(),
    ...paging,
  });
  res.json(pagedResponse(result, paging));
});
