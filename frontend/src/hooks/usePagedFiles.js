/**
 * Loads the paged file list from GET /files/search. Cancels the previous request with AbortController,
 * and if the requested page is beyond the last page, reports the last page via onPageClamp.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchFiles } from '../api/files.js';

export default function usePagedFiles({ query, category, page, limit = 20, onPageClamp }) {
  const [state, setState] = useState({ status: 'loading', files: [], pagination: null, error: '' });
  const [nonce, setNonce] = useState(0);
  const clampRef = useRef(onPageClamp);
  clampRef.current = onPageClamp;

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    searchFiles({ query, category, page, limit }, ctrl.signal)
      .then((d) => {
        const pg = d.pagination || { page, limit, total: 0, total_pages: 0 };
        // Page beyond the last page: jump to the last page.
        if (pg.total_pages > 0 && page > pg.total_pages && clampRef.current) {
          clampRef.current(pg.total_pages);
          return;
        }
        setState({ status: 'ready', files: d.files || [], pagination: pg, error: '' });
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setState((s) => ({ ...s, status: 'error', error: e.message }));
      });
    return () => ctrl.abort();
  }, [query, category, page, limit, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
