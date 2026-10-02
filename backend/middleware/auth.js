/**
 * STUB JWT auth middleware so this module runs standalone.
 * The auth feature owns the real one - when it lands, replace this file with
 * theirs. Contract my code relies on:  req.user.id  (the users.id of the caller).
 *
 * Assumption: the JWT payload carries the user id as `id` (falls back to `sub`).
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...payload, id: payload.id ?? payload.sub };
    if (req.user.id === undefined) throw new Error('no user id in token');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
