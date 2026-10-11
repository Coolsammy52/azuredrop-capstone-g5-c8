/** Theme context: follows the system by default; the toggle sets data-theme and remembers the choice. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);
const KEY = 'azuredrop-theme';

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { const t = localStorage.getItem(KEY); if (t === 'light' || t === 'dark') return t; } catch { /* ignore */ }
    return systemDark() ? 'dark' : 'light';
  });

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
