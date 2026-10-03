/**
 * End-to-end API test: starts the server and calls every endpoint of
 * auth (incl. forgot/reset password), categories, search, metadata and share links.
 *
 * Run (from backend/):   npm run test:e2e
 *
 * Needs a DISPOSABLE PostgreSQL database - the script EMPTIES its tables.
 * For safety it refuses to run unless the database name contains "test".
 *
 * Settings (environment variables, nothing is hardcoded):
 *   TEST_DB_NAME      required, must contain "test", e.g. azuredrop_test
 *   TEST_DB_PASSWORD  required
 *   TEST_DB_HOST      default localhost
 *   TEST_DB_PORT      default 5432
 *   TEST_DB_USER      default postgres
 *   TEST_API_PORT     default 3100
 *
 * Not covered: real file upload/download (needs a real Azure storage account).
 * Files are inserted straight into the database with a fake blob URL instead.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');

const BACKEND = path.join(__dirname, '..');
const cfg = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT, 10) || 5432,
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_NAME,
};
const apiPort = process.env.TEST_API_PORT || '3100';
const api = `http://localhost:${apiPort}`;

if (!cfg.database || !cfg.password) {
  console.error('Set TEST_DB_NAME and TEST_DB_PASSWORD first (see the top of this file).');
  process.exit(2);
}
if (!/test/i.test(cfg.database)) {
  console.error(`Refusing to run: database "${cfg.database}" does not look like a test database (name must contain "test").`);
  process.exit(2);
}

const env = {
  ...process.env,
  PORT: apiPort,
  DB_HOST: cfg.host, DB_PORT: String(cfg.port), DB_USER: cfg.user, DB_PASSWORD: cfg.password, DB_NAME: cfg.database,
  JWT_SECRET: 'e2e-test-secret',
  // Fake storage account: lets the share endpoint sign a link without touching Azure.
  AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=x;AccountKey=eA==;EndpointSuffix=core.windows.net',
  AZURE_STORAGE_CONTAINER: 'c',
  FRONTEND_URL: 'http://localhost:5173',
  SMTP_HOST: '', // keep empty so the reset link is printed to the server console
};

const db = new Pool(cfg);
let serverOut = '';
let pass = 0;
let fail = 0;

async function call(label, method, urlPath, { body, token, expect, redirect } = {}) {
  const res = await fetch(api + urlPath, {
    method,
    redirect: redirect || 'follow',
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  const ok = res.status === expect;
  if (ok) pass++; else fail++;
  let shown = JSON.stringify(data) || '';
  if (shown.length > 230) shown = `${shown.slice(0, 230)}...`;
  const shownPath = urlPath.split('?')[0].replace(/[A-Za-z0-9_-]{30,}/, '<token>');
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${method} ${shownPath}  -> ${res.status} (expected ${expect})  [${label}]\n      ${shown}`);
  return { status: res.status, data };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function prepareDatabase() {
  await db.query(fs.readFileSync(path.join(BACKEND, 'src/config/schema.sql'), 'utf8'));
  const dir = path.join(BACKEND, 'migrations');
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    await db.query(fs.readFileSync(path.join(dir, f), 'utf8'));
  }
  await db.query('TRUNCATE users, files, shared_links, password_reset_tokens RESTART IDENTITY CASCADE');
}

async function run() {
  await prepareDatabase();

  const srv = spawn('node', ['src/server.js'], { cwd: BACKEND, env });
  srv.stdout.on('data', (d) => { serverOut += d; });
  srv.stderr.on('data', (d) => { serverOut += d; });
  for (let i = 0; i < 40 && !serverOut.includes('running'); i++) await wait(300);

  try {
    console.log('\n=== 1. HEALTH ===');
    await call('server alive', 'GET', '/health', { expect: 200 });

    console.log('\n=== 2. AUTH (register, login, me) ===');
    await call('register', 'POST', '/auth/register', { body: { name: 'Test User', email: 'test@example.com', password: 'password123' }, expect: 201 });
    await call('duplicate email', 'POST', '/auth/register', { body: { name: 'T', email: 'test@example.com', password: 'password123' }, expect: 409 });
    await call('wrong password', 'POST', '/auth/login', { body: { email: 'test@example.com', password: 'nope' }, expect: 401 });
    const login = await call('login', 'POST', '/auth/login', { body: { email: 'test@example.com', password: 'password123' }, expect: 200 });
    await call('current user', 'GET', '/auth/me', { token: login.data.token, expect: 200 });

    console.log('\n=== 3. FORGOT / RESET PASSWORD ===');
    await call('unknown email, same generic reply', 'POST', '/auth/forgot-password', { body: { email: 'nobody@example.com' }, expect: 200 });
    await call('missing email', 'POST', '/auth/forgot-password', { body: {}, expect: 400 });
    await call('known email', 'POST', '/auth/forgot-password', { body: { email: 'test@example.com' }, expect: 200 });
    await wait(300);
    const m = serverOut.match(/reset-password\?token=([a-f0-9]{64})/);
    console.log(`      reset link printed in server console (no SMTP): ${m ? 'yes' : 'NO'}`);
    const resetToken = m && m[1];
    await call('bad token', 'POST', '/auth/reset-password', { body: { token: 'f'.repeat(64), password: 'newpassword1' }, expect: 400 });
    await call('short password', 'POST', '/auth/reset-password', { body: { token: resetToken, password: 'short' }, expect: 400 });
    await call('reset with real token', 'POST', '/auth/reset-password', { body: { token: resetToken, password: 'newpassword1' }, expect: 200 });
    await call('token cannot be reused', 'POST', '/auth/reset-password', { body: { token: resetToken, password: 'another12345' }, expect: 400 });
    await call('old password rejected', 'POST', '/auth/login', { body: { email: 'test@example.com', password: 'password123' }, expect: 401 });
    const login2 = await call('new password works', 'POST', '/auth/login', { body: { email: 'test@example.com', password: 'newpassword1' }, expect: 200 });
    const t = login2.data.token;
    const raw = await db.query('SELECT token_hash FROM password_reset_tokens');
    console.log(`      stored value is a hash, not the token: ${raw.rows[0].token_hash !== resetToken}`);

    await call('second user', 'POST', '/auth/register', { body: { name: 'Other User', email: 'other@example.com', password: 'password123' }, expect: 201 });
    await db.query(`INSERT INTO files (user_id, filename, file_type, file_size, category, file_url) VALUES
      (1,'q3-invoice.pdf','application/pdf',48213,'other','https://x.blob.core.windows.net/c/users/1/1-q3-invoice.pdf'),
      (1,'holiday_photo.png','image/png',250000,'other','https://x.blob.core.windows.net/c/users/1/2-holiday_photo.png'),
      (1,'notes.txt','text/plain',900,'other','https://x.blob.core.windows.net/c/users/1/3-notes.txt'),
      (2,'secret.pdf','application/pdf',100,'other','https://x.blob.core.windows.net/c/users/2/4-secret.pdf')`);

    console.log('\n=== 4. CATEGORIES ===');
    await call('set category', 'PATCH', '/files/1/category', { token: t, body: { category: 'invoices' }, expect: 200 });
    await call('set category 2', 'PATCH', '/files/2/category', { token: t, body: { category: 'photos' }, expect: 200 });
    await call('category too long', 'PATCH', '/files/1/category', { token: t, body: { category: 'x'.repeat(51) }, expect: 400 });
    await call('missing category field', 'PATCH', '/files/1/category', { token: t, body: {}, expect: 400 });
    await call('list categories with counts', 'GET', '/files/categories', { token: t, expect: 200 });
    await call('files in a category', 'GET', '/files/category/invoices', { token: t, expect: 200 });
    await call('case-insensitive', 'GET', '/files/category/INVOICES', { token: t, expect: 200 });
    await call("can't change someone else's file", 'PATCH', '/files/4/category', { token: t, body: { category: 'hacked' }, expect: 404 });
    const cleared = await call('clear -> resets to other', 'PATCH', '/files/3/category', { token: t, body: { category: null }, expect: 200 });
    console.log(`      category after clear: ${cleared.data.file && cleared.data.file.category}`);

    console.log('\n=== 5. SEARCH ===');
    await call('by filename', 'GET', '/files/search?query=invoice', { token: t, expect: 200 });
    await call('by filename + category', 'GET', '/files/search?query=photo&category=photos', { token: t, expect: 200 });
    const none = await call('no match', 'GET', '/files/search?query=zzz', { token: t, expect: 200 });
    console.log(`      files returned: ${none.data.files.length}`);
    const wild = await call('% is literal, not wildcard', 'GET', '/files/search?query=%25', { token: t, expect: 200 });
    console.log(`      files returned: ${wild.data.files.length}`);
    const paged = await call('paging', 'GET', '/files/search?limit=2&page=2', { token: t, expect: 200 });
    console.log(`      page 2 (2 per page) returned ${paged.data.files.length} file, pagination: ${JSON.stringify(paged.data.pagination)}`);
    await call('does not see other users files', 'GET', '/files/search?query=secret', { token: t, expect: 200 });

    console.log('\n=== 6. METADATA ===');
    await call('full metadata', 'GET', '/files/1/metadata', { token: t, expect: 200 });
    await call("someone else's file -> 404", 'GET', '/files/4/metadata', { token: t, expect: 404 });
    await call('missing file -> 404', 'GET', '/files/9999/metadata', { token: t, expect: 404 });
    await call('non-numeric id -> 400', 'GET', '/files/abc/metadata', { token: t, expect: 400 });

    console.log('\n=== 7. SHARE LINKS ===');
    await call('bad expiry', 'POST', '/files/1/share', { token: t, body: { expires_in_minutes: 0 }, expect: 400 });
    await call('too long expiry', 'POST', '/files/1/share', { token: t, body: { expires_in_minutes: 99999 }, expect: 400 });
    await call("can't share someone else's file", 'POST', '/files/4/share', { token: t, body: {}, expect: 404 });
    const s = await call('create link (5 min)', 'POST', '/files/1/share', { token: t, body: { expires_in_minutes: 5 }, expect: 201 });
    const tok = s.data.share_token;
    console.log(`      token length: ${tok.length}`);
    const pub = await call('PUBLIC access, no login', 'GET', `/share/${tok}`, { expect: 200 });
    const pubText = JSON.stringify(pub.data);
    console.log(`      uploader/user_id exposed publicly: ${pubText.includes('uploader') || pubText.includes('user_id')}`);
    await call('redirect mode', 'GET', `/share/${tok}?redirect=1`, { redirect: 'manual', expect: 302 });
    await call('list links', 'GET', '/files/1/shares', { token: t, expect: 200 });
    await call('unknown token', 'GET', '/share/doesnotexist', { expect: 404 });
    const s2 = await call('create 2nd link', 'POST', '/files/1/share', { token: t, body: { expires_in_minutes: 5 }, expect: 201 });
    await db.query("UPDATE shared_links SET expires_at = NOW() - interval '1 minute' WHERE share_token = $1", [s2.data.share_token]);
    await call('EXPIRED link', 'GET', `/share/${s2.data.share_token}`, { expect: 410 });
    await call('revoke', 'DELETE', `/shares/${tok}`, { token: t, expect: 204 });
    await call('revoked link is gone', 'GET', `/share/${tok}`, { expect: 404 });

    console.log('\n=== 8. SECURITY ===');
    await call('no token', 'GET', '/files/search', { expect: 401 });
    await call('bad token', 'GET', '/files/search', { token: 'garbage', expect: 401 });
    await call('share needs login', 'POST', '/files/1/share', { expect: 401 });

    console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  } finally {
    srv.kill();
    await db.end();
  }
  process.exit(fail ? 1 : 0);
}

run().catch((err) => {
  console.error('Test run failed:', err.message);
  process.exit(2);
});
