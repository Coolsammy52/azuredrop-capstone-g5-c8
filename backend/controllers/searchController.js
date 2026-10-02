/** Feature 2 - File search (also hosts the paging helpers used by the category list). */
const fileModel = require('../models/fileModel');
const { asyncHandler } = require('../utils/http');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Parse ?page= (1-based) and ?limit= into safe limit/offset numbers. */
function parsePaging(q) {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

function pagedResponse({ rows, total }, { page, limit }) {
  return {
    files: rows.map(fileModel.toMetadata),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

/**
 * GET /files/search?query=&category=&page=&limit=
 * Both filters are optional; with neither it lists all of the caller's files.
 */
exports.searchFiles = asyncHandler(async (req, res) => {
  // Query-string values can be arrays (?query=a&query=b) - only accept strings.
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  const paging = parsePaging(req.query);
  const result = await fileModel.search({
    userId: req.user.id,
    query: query || undefined,
    category: category || undefined,
    ...paging,
  });
  res.json(pagedResponse(result, paging));
});

exports.parsePaging = parsePaging;
exports.pagedResponse = pagedResponse;
