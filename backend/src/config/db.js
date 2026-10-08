const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL pool, configured only from environment variables.
 *
 * Azure Database for PostgreSQL requires an encrypted connection: set DB_SSL=true.
 * The server certificate is verified by default. Only if that fails with a
 * certificate error, DB_SSL_REJECT_UNAUTHORIZED=false turns verification off
 * (the connection stays encrypted, but the server's identity is not checked).
 * Leave DB_SSL unset for a local database.
 */
const ssl = process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl
});

module.exports = pool;
