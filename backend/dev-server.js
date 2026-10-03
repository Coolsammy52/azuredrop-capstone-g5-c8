/**
 * STANDALONE dev server so these features can run without the shared app.
 * When merging, do NOT copy this file - in the real app.js just add:
 *
 *   app.use('/', require('./routes/features'));       // before the files router
 *   app.use(require('./utils/http').errorHandler);    // last, if no error handler exists
 *   app.get('/health', ...)                           // only if /health doesn't exist yet
 */
require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const { errorHandler } = require('./utils/http');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

app.use('/', require('./routes/features'));
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AzureDrop (features) listening on :${port}`));
