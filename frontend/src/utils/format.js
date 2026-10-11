/**
 * Shared formatting helpers so sizes, dates and names look the same on every screen.
 */

/** Bytes to a human string, e.g. 2.4 MB. @param {number} bytes */
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

/** Short date: "Today", "Yesterday", "12 Sep", or "12 Sep 2024" for other years. @param {string} iso */
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-GB', opts);
}

/** Time of day, e.g. "14:05". */
export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Full date and time, e.g. "12 Sep 2026, 14:05". */
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${formatTime(iso)}`;
}

/** Initials for avatars. @param {string} name */
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Shorten a token for display. */
export function truncateToken(token) {
  const t = String(token || '');
  return t.length > 14 ? `${t.slice(0, 8)}…${t.slice(-4)}` : t;
}

/** The public share URL for a token. Always built from the frontend origin. */
export function shareUrl(token) {
  return `${window.location.origin}/s/${token}`;
}
