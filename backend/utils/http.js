/** Small HTTP helpers shared by controllers and the error handler. */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Express 4 does not catch rejected promises - wrap async handlers with this. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Central error handler. Mount last. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Postgres: invalid input syntax (e.g. non-numeric id for an integer column)
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid identifier' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, asyncHandler, errorHandler };
