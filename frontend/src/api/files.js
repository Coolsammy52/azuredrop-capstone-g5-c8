/**
 * File endpoints: search/list, categories, metadata, category update, blob download and upload with progress.
 */
import { request, apiUrl, getToken, notifyUnauthorized, ApiError, NETWORK_MESSAGE } from './client.js';

/** Main file list. Empty params are omitted. @param {{query?:string, category?:string, page?:number, limit?:number}} p */
export function searchFiles({ query, category, page = 1, limit = 20 } = {}, signal) {
  const qs = new URLSearchParams();
  if (query) qs.set('query', query);
  if (category) qs.set('category', category);
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  return request(`/files/search?${qs.toString()}`, { signal });
}

export const getCategories = (signal) => request('/files/categories', { signal });

export const getMetadata = (id, signal) => request(`/files/${encodeURIComponent(id)}/metadata`, { signal });

/** Free text category, trimmed; empty resets to "other" on the server. */
export const updateCategory = (id, category) =>
  request(`/files/${encodeURIComponent(id)}/category`, { method: 'PATCH', body: { category } });

/** Permanently delete a file (storage blob, record and its share links). Resolves with null on 204. */
export const deleteFile = (id) =>
  request(`/files/${encodeURIComponent(id)}`, { method: 'DELETE' });

/**
 * Download needs the Authorization header, so fetch as a blob and trigger a save
 * through a temporary object URL (a plain link would not send the token).
 */
export async function downloadFile(id, filename) {
  const res = await request(`/files/${encodeURIComponent(id)}/download`, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Upload one file with progress using XMLHttpRequest (fetch has no upload progress).
 * Returns { promise, abort }. The promise resolves with the server's file object.
 * @param {File} file
 * @param {(percent:number, loaded:number, total:number)=>void} onProgress
 */
export function uploadFile(file, onProgress) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    const token = getToken();
    if (!token) { notifyUnauthorized(); reject(new ApiError('Your session expired. Log in again.', 401)); return; }
    xhr.open('POST', apiUrl('/files/upload'));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total);
    };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) { resolve(data && data.file); return; }
      if (xhr.status === 401) { notifyUnauthorized(); reject(new ApiError('Your session expired. Log in again.', 401)); return; }
      reject(new ApiError((data && data.error) || 'Upload failed. Please try again.', xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 0));
    xhr.onabort = () => { const e = new Error('Upload cancelled'); e.name = 'AbortError'; reject(e); };
    const form = new FormData();
    form.append('file', file); // field name required by the backend
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

export { NETWORK_MESSAGE };
