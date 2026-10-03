/**
 * Routes for: categories, search, share links, metadata.
 *
 * Mount at the app root, BEFORE any router that defines `/files/:id`, so the
 * static paths below (/files/search, /files/categories ...) are not swallowed:
 *
 *   app.use('/', require('./routes/features'));
 */
const express = require('express');
const auth = require('../middleware/auth');
const category = require('../controllers/categoryController');
const search = require('../controllers/searchController');
const share = require('../controllers/shareController');
const metadata = require('../controllers/metadataController');

const router = express.Router();

// ---- Public (no login) ----
router.get('/share/:token', share.accessSharedFile);

// ---- Authenticated ----
// Order matters: static segments before /files/:id/...
router.get('/files/search', auth, search.searchFiles);
router.get('/files/categories', auth, category.listCategories);
router.get('/files/category/:category', auth, category.listFilesByCategory);

router.get('/files/:id/metadata', auth, metadata.getMetadata);
router.patch('/files/:id/category', auth, category.setCategory);

router.post('/files/:id/share', auth, share.createShareLink);
router.get('/files/:id/shares', auth, share.listShareLinks);
router.delete('/shares/:token', auth, share.revokeShareLink);

module.exports = router;
