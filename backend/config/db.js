/**
 * PostgreSQL connection pool.
 * Configured purely from environment variables (DATABASE_URL or PG* vars).
 *
 * NOTE: if the shared app already has a pool module, delete this file and
 * point the `require('../config/db')` calls in models/ at that one instead.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
