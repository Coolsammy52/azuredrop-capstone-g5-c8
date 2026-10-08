/**
 * API client: the single place that builds URLs, attaches the token, parses JSON
 * and turns failures into ApiError with a friendly message.
 */

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN_KEY = 'azuredrop-token';

/** Error with an HTTP status (0 for network failures). */
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const NETWORK_MESSAGE = "Can't reach the server. Check your connection and try again.";

/** Token lives in localStorage ("keep me signed in") or sessionStorage. */
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token, remember) {
  clearToken();
  try { (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token); } catch { /* storage blocked */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export function apiUrl(path) { return `${BASE}${path}`; }

/** Called on any 401 from a private call; the auth context registers the handler. */
let unauthorizedHandler = null;
export function onUnauthorized(fn) { unauthorizedHandler = fn; }
export function notifyUnauthorized() { if (unauthorizedHandler) unauthorizedHandler(); }

async function readError(res) {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch { /* not JSON */ }
  return 'Something went wrong. Please try again.';
}

/**
 * Generic request.
 * @param {string} path
 * @param {{method?:string, body?:any, auth?:boolean, signal?:AbortSignal, raw?:boolean}} [opts]
 */
export async function request(path, { method = 'GET', body, auth = true, signal, raw = false } = {}) {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (!token) { notifyUnauthorized(); throw new ApiError('Your session expired. Log in again.', 401); }
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(apiUrl(path), { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(NETWORK_MESSAGE, 0);
  }

  if (!res.ok) {
    if (res.status === 401 && auth) { notifyUnauthorized(); throw new ApiError('Your session expired. Log in again.', 401); }
    throw new ApiError(await readError(res), res.status);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  try { return await res.json(); } catch { return null; }
}
