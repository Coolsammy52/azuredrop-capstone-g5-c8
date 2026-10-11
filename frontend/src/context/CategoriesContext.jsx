/**
 * Categories context: the sidebar list from GET /files/categories. Call refresh() after uploads and
 * category changes. State is cleared whenever the user changes (log out) so nothing leaks between users.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCategories } from '../api/files.js';
import { useAuth } from './AuthContext.jsx';

const CategoriesContext = createContext(null);
export const useCategories = () => useContext(CategoriesContext);

export function CategoriesProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ctrlRef = useRef(null);

  const refresh = useCallback(async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true);
    try {
      const d = await getCategories(ctrl.signal);
      setCategories(d.categories || []);
      setError('');
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e.message);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (ctrlRef.current) ctrlRef.current.abort();
      setCategories([]); setError(''); setLoading(false);
      return;
    }
    refresh();
  }, [user, refresh]);

  const value = useMemo(() => ({ categories, loading, error, refresh }), [categories, loading, error, refresh]);
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
