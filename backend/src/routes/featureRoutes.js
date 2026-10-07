/**
 * Routes for: categories, search, share links, metadata.
 *
 * Mounted at the app root in src/server.js, BEFORE the /files router, so the
 * static paths below (/files/search, /files/categories ...) are matched first:
 *
 *   app.use("/", require("./routes/featureRoutes"));
 */
const express = require('express');
const auth = require('../middleware/authMiddleware');
const category = require('../controllers/categoryController');
const search = require('../controllers/searchController');
const share = require('../controllers/shareController');
const metadata = require('../controllers/metadataController');
const removal = require('../controllers/deleteFileController');

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
router.delete('/files/:id', auth, removal.deleteFile);

router.post('/files/:id/share', auth, share.createShareLink);
router.get('/files/:id/shares', auth, share.listShareLinks);
router.delete('/shares/:token', auth, share.revokeShareLink);

module.exports = router;
