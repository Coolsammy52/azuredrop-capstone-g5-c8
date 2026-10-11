/**
 * Auth context: holds the current user, loads it from GET /auth/me on startup when a token exists,
 * and handles login/logout and the global "session expired" flow (any 401 from a private call).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import { clearToken, getToken, onUnauthorized, setToken } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  const [user, setUser] = useState(null);
  // loading is true only while a stored token is being verified on startup.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Verify the stored token once on startup.
  useEffect(() => {
    if (!getToken()) { setLoading(false); return undefined; }
    const ctrl = new AbortController();
    authApi.me(ctrl.signal)
      .then((d) => setUser(d.user))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        // A 401 is handled by the global handler; other errors leave the user logged out.
        if (e.status !== 401) clearToken();
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  // Global 401 handling: drop the session, remember where the user was, go to login.
  useEffect(() => {
    onUnauthorized(() => {
      clearToken();
      setUser(null);
      const loc = locationRef.current;
      if (loc.pathname === '/login') return;
      navigate('/login', { replace: true, state: { from: loc, expired: true } });
    });
    return () => onUnauthorized(null);
  }, [navigate]);

  const login = useCallback(async (email, password, remember) => {
    const data = await authApi.login(email, password);
    setToken(data.token, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null); // dependants (categories) clear their state when user becomes null
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
