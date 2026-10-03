/**
 * Minimal migration runner: applies every migrations/*.sql in filename order.
 * Migrations are idempotent (IF NOT EXISTS), so re-running is safe.
 *   npm run migrate
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

(async () => {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  try {
    for (const file of files) {
      console.log(`Applying ${file} ...`);
      await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    }
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
