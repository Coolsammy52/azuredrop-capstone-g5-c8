/** Share-link endpoints. getPublicShare is public: no Authorization header, no 401 handling. */
import { request } from './client.js';

export const createShare = (fileId, expiresInMinutes) =>
  request(`/files/${encodeURIComponent(fileId)}/share`, { method: 'POST', body: { expires_in_minutes: expiresInMinutes } });

export const listShares = (fileId, signal) => request(`/files/${encodeURIComponent(fileId)}/shares`, { signal });

export const revokeShare = (token) => request(`/shares/${encodeURIComponent(token)}`, { method: 'DELETE' });

export const getPublicShare = (token, signal) =>
  request(`/share/${encodeURIComponent(token)}`, { auth: false, signal });
