/**
 * PREVIEW MODE ONLY (run with `npm run dev:preview`). Not part of the real app.
 *
 * Lets reviewers look at every screen without a backend by answering the API calls in the browser with
 * sample data. The real pages and the real API client are untouched; this file only replaces
 * window.fetch and XMLHttpRequest for requests to VITE_API_URL, and signs in a fake user.
 *
 * This is fake data. Delete the whole src/preview folder, .env.preview and the "dev:preview" script
 * (and the small block in main.jsx) before the final hand-in.
 */

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN_KEY = 'azuredrop-token';
const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const now = Date.now();
const iso = (msAgo) => new Date(now - msAgo).toISOString();
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const PDF = 'application/pdf';
const PNG = 'image/png';
const JPG = 'image/jpeg';
const TXT = 'text/plain';
const DOC = 'application/msword';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const user = { id: 1, name: 'Amina Preview', email: 'preview@example.com', created_at: iso(30 * DAY) };

// Sample files. Cycled to 27 entries so the pager shows more than one page.
const TEMPLATES = [
  ['Project_Specs.pdf', PDF, 'Documentation', 2.4 * 1024 * 1024],
  ['Final_Design.png', PNG, 'Design', 5.1 * 1024 * 1024],
  ['Meeting notes.txt', TXT, 'other', 3 * 1024],
  ['Budget 2026.docx', DOCX, 'Finance', 220 * 1024],
  ['Passport photo.jpg', JPG, 'Personal', 1.2 * 1024 * 1024],
  ['Old report.doc', DOC, 'Documentation', 480 * 1024],
  ['A very long file name that keeps going and going to test how truncation looks in the table and on small screens.pdf', PDF, 'Finance', 900 * 1024],
  ['Logo.png', PNG, 'Design', 64 * 1024],
  ['Cover letter.docx', DOCX, 'Personal', 45 * 1024],
];
let nextId = 1;
const files = Array.from({ length: 27 }, (_, i) => {
  const [name, type, category, size] = TEMPLATES[i % TEMPLATES.length];
  const round = Math.floor(i / TEMPLATES.length);
  const dot = name.lastIndexOf('.');
  const filename = round === 0 ? name : `${name.slice(0, dot)} (${round})${name.slice(dot)}`;
  return {
    id: nextId++, filename, file_type: type, file_size: Math.round(size), category,
    file_url: 'internal://preview', uploaded_at: iso(i * 9 * HOUR + 2 * HOUR),
    uploader: i === 2 ? null : { id: 1, name: user.name }, // one file without an uploader name
  };
});

let nextShareId = 1;
const shares = [
  { id: nextShareId++, file_id: 1, share_token: 'demo-active', expires_at: new Date(now + 2 * HOUR).toISOString(), created_at: iso(10 * MIN) },
  { id: nextShareId++, file_id: 1, share_token: 'demo-expired', expires_at: iso(HOUR), created_at: iso(DAY) },
];

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const meta = (f) => ({ ...f });
const shareOut = (s) => ({ ...s, expired: new Date(s.expires_at).getTime() < Date.now() });
const randomToken = () => `prev${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 8)}`;

/** Route a request to sample data. Returns a Response. */
function route(method, path, params, body) {
  let m;
  if (method === 'POST' && path === '/auth/login') return json(200, { message: 'Logged in', token: 'preview-token', user: { id: 1, name: user.name, email: (body && body.email) || user.email } });
  if (method === 'POST' && path === '/auth/register') return json(201, { message: 'Registered', user });
  if (method === 'POST' && path === '/auth/forgot-password') return json(200, { message: 'If that email is registered, we have sent a reset link' });
  if (method === 'POST' && path === '/auth/reset-password') {
    return body && body.token === 'bad' ? json(400, { error: 'Reset link is invalid or has expired' }) : json(200, { message: 'Password updated' });
  }
  if (method === 'GET' && path === '/auth/me') return json(200, { user });

  if (method === 'GET' && path === '/files/categories') {
    const counts = {};
    files.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });
    return json(200, { categories: Object.keys(counts).sort().map((c) => ({ category: c, file_count: counts[c] })) });
  }
  if (method === 'GET' && path === '/files/search') {
    const q = (params.get('query') || '').toLowerCase();
    const cat = (params.get('category') || '').toLowerCase();
    const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10) || 20));
    const list = files.filter((f) => (!q || f.filename.toLowerCase().includes(q)) && (!cat || f.category.toLowerCase() === cat));
    const total = list.length;
    return json(200, { files: list.slice((page - 1) * limit, page * limit).map(meta), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  }

  if ((m = /^\/files\/(\d+)\/(metadata|category|download|share|shares)$/.exec(path))) {
    const id = Number(m[1]);
    const file = files.find((f) => f.id === id);
    if (!file) return json(404, { error: 'File not found' });
    const what = m[2];
    if (method === 'GET' && what === 'metadata') return json(200, { file: meta(file) });
    if (method === 'PATCH' && what === 'category') {
      const c = body && typeof body.category === 'string' ? body.category.trim() : '';
      if (c.length > 50) return json(400, { error: 'Category must be 50 characters or fewer' });
      file.category = c || 'other';
      return json(200, { file: meta(file) });
    }
    if (method === 'GET' && what === 'download') {
      return new Response(new Blob([`Preview content for ${file.filename}`], { type: 'text/plain' }), { status: 200 });
    }
    if (method === 'POST' && what === 'share') {
      const mins = body ? body.expires_in_minutes : 60;
      if (!Number.isInteger(mins) || mins < 1 || mins > 10080) return json(400, { error: 'expires_in_minutes must be a whole number from 1 to 10080' });
      const s = { id: nextShareId++, file_id: id, share_token: randomToken(), expires_at: new Date(Date.now() + mins * MIN).toISOString(), created_at: new Date().toISOString() };
      shares.unshift(s);
      return json(201, { share_token: s.share_token, share_path: `/share/${s.share_token}`, expires_at: s.expires_at, created_at: s.created_at, file_id: id });
    }
    if (method === 'GET' && what === 'shares') return json(200, { shares: shares.filter((s) => s.file_id === id).map(shareOut) });
  }

  if (method === 'DELETE' && (m = /^\/shares\/([^/]+)$/.exec(path))) {
    const i = shares.findIndex((s) => s.share_token === m[1]);
    if (i < 0) return json(404, { error: 'Share link not found' });
    shares.splice(i, 1);
    return new Response(null, { status: 204 });
  }

  // Public share page: /s/demo-active, /s/demo-expired, /s/anything-else (not found)
  if (method === 'GET' && (m = /^\/share\/([^/]+)$/.exec(path))) {
    const s = shares.find((x) => x.share_token === m[1]);
    if (!s) return json(404, { error: 'Share link not found' });
    if (new Date(s.expires_at).getTime() < Date.now()) return json(410, { error: 'Share link has expired' });
    const f = files.find((x) => x.id === s.file_id);
    const url = URL.createObjectURL(new Blob([`Preview content for ${f.filename}`], { type: 'text/plain' }));
    return json(200, {
      file: { id: f.id, filename: f.filename, file_type: f.file_type, file_size: f.file_size, category: f.category, uploaded_at: f.uploaded_at },
      download_url: url, download_url_expires_at: new Date(Date.now() + 10 * MIN).toISOString(), share_expires_at: s.expires_at,
    });
  }
  return json(404, { error: 'Not found (preview mode)' });
}

/** Stand-in for XMLHttpRequest used by the upload page: fake progress, then adds the file to the sample list. */
class PreviewXHR {
  constructor() { this.upload = {}; this.status = 0; this.responseText = ''; this._timer = null; }
  open(method, url) { this._url = url; }
  setRequestHeader() {}
  send(form) {
    const file = form.get('file');
    const total = file.size || 1;
    let loaded = 0;
    this._timer = setInterval(() => {
      loaded = Math.min(total, loaded + total / 10);
      if (this.upload.onprogress) this.upload.onprogress({ lengthComputable: true, loaded, total });
      if (loaded < total) return;
      clearInterval(this._timer);
      if (/fail/i.test(file.name)) { // name a file with "fail" to see the server-error state
        this.status = 500; this.responseText = JSON.stringify({ error: 'File upload failed' });
      } else {
        const f = { id: nextId++, filename: file.name, file_type: file.type || TXT, file_size: file.size, category: 'other', file_url: 'internal://preview', uploaded_at: new Date().toISOString(), uploader: { id: 1, name: user.name } };
        files.unshift(f);
        this.status = 201; this.responseText = JSON.stringify({ message: 'File uploaded', file: { ...f, user_id: 1 } });
      }
      if (this.onload) this.onload();
    }, 250);
  }
  abort() { clearInterval(this._timer); if (this.onabort) this.onabort(); }
}

/** Turn preview mode on: fake sign-in, patched fetch/XHR and a visible banner. */
export function installPreview() {
  try {
    if (!sessionStorage.getItem(TOKEN_KEY) && !localStorage.getItem(TOKEN_KEY)) sessionStorage.setItem(TOKEN_KEY, 'preview-token');
  } catch { /* storage blocked */ }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith(API)) return realFetch(input, init);
    const rest = url.slice(API.length);
    const [path, query = ''] = rest.split('?');
    let body = null;
    if (typeof init.body === 'string') { try { body = JSON.parse(init.body); } catch { body = null; } }
    await delay(300); // so loading states are visible in the preview
    return route((init.method || 'GET').toUpperCase(), path, new URLSearchParams(query), body);
  };
  window.XMLHttpRequest = PreviewXHR;

  const note = document.createElement('div');
  note.setAttribute('role', 'note');
  note.textContent = 'Preview mode: sample data, no backend';
  note.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:100;padding:4px 10px;border-radius:999px;font:600 12px Figtree,system-ui,sans-serif;background:var(--warnbg);color:var(--warn);border:1px solid var(--warn);pointer-events:none';
  document.body.appendChild(note);
}
