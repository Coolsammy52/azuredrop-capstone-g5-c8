/** Auth endpoints. Public calls pass auth:false so no Authorization header is sent. */
import { request } from './client.js';

export const register = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password }, auth: false });

export const me = (signal) => request('/auth/me', { signal });

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });

export const resetPassword = (token, password) =>
  request('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false });
