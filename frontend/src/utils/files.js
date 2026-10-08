/**
 * File-type helpers: chip label and colours, and client-side upload validation
 * (same rules as the server: 10 MB max, PDF/DOC/DOCX/TXT/JPG/PNG only).
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
};
const EXT_TO_TYPE = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
};

function extOf(name) {
  const m = /\.([^.]+)$/.exec(String(name || ''));
  return m ? m[1].toLowerCase() : '';
}

/** Chip label and token colours for a file. @param {string} fileType MIME type @param {string} filename */
export function fileChip(fileType, filename) {
  const label = ALLOWED[fileType] || (extOf(filename).toUpperCase().slice(0, 4) || 'FILE');
  let style = { background: 'var(--line)', color: 'var(--muted)' };
  if (label === 'PDF') style = { background: 'var(--errbg)', color: 'var(--err)' };
  else if (label === 'PNG' || label === 'JPG') style = { background: 'var(--okbg)', color: 'var(--ok)' };
  else if (label === 'DOC' || label === 'DOCX') style = { background: 'var(--tint)', color: 'var(--primary)' };
  return { label, style };
}

/**
 * Validate a File before upload. Returns an error message or null.
 * Falls back to the extension when the browser gives no MIME type.
 * @param {File} file
 */
export function validateUpload(file) {
  const type = file.type || EXT_TO_TYPE[extOf(file.name)] || '';
  if (!ALLOWED[type]) return `${file.name} is not an allowed type. Use PDF, Word, TXT, JPG or PNG.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is over the 10 MB limit. Choose a smaller file.`;
  return null;
}

export const ACCEPT_ATTR = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
