/**
 * My files: search + category filter + sortable table/cards + pager, all driven by the URL
 * (?query=&category=&page=) so refresh and back work. Data comes from GET /files/search.
 */
import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import FileList, { FileListSkeleton, sortFiles } from '../components/FileList.jsx';
import Pager from '../components/Pager.jsx';
import { Banner, Button, EmptyState } from '../components/ui.jsx';
import { downloadFile } from '../api/files.js';
import { useCategories } from '../context/CategoriesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePagedFiles from '../hooks/usePagedFiles.js';

export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { categories } = useCategories();

  const query = params.get('query') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const [sort, setSort] = useState({ key: 'uploaded_at', dir: 'desc' });
  const [downloadingId, setDownloadingId] = useState(null);

  const update = useCallback((changes, replace = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => { if (v === '' || v == null || (k === 'page' && Number(v) <= 1)) next.delete(k); else next.set(k, String(v)); });
    setParams(next, { replace });
  }, [params, setParams]);

  const { status, files, pagination, error, reload } = usePagedFiles({
    query, category, page, onPageClamp: (last) => update({ page: last }, true),
  });

  function onSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'uploaded_at' || key === 'file_size' ? 'desc' : 'asc' }));
  }

  async function onDownload(file) {
    if (downloadingId) return; // ignore double clicks
    setDownloadingId(file.id);
    try {
      await downloadFile(file.id, file.filename);
      toast.success(`Downloading ${file.filename}.`);
    } catch (e) {
      if (e.status !== 401) toast.error(e.status === 404 ? 'File not found. It may have been moved.' : e.message);
    } finally {
      setDownloadingId(null);
    }
  }

  const onShare = (file) => navigate(`/files/${file.id}#share`);
  const hasFilters = Boolean(query || category);
  const sorted = sortFiles(files, sort);
  const chips = [{ category: '', label: 'All' }, ...categories.map((c) => ({ category: c.category, label: c.category }))];

  let body;
  if (status === 'loading' && files.length === 0) {
    body = <FileListSkeleton />;
  } else if (status === 'error') {
    body = (
      <Banner type="err" action={<Button size="sm" variant="secondary" onClick={reload}><Icon name="refresh" size={14} /> Retry</Button>}>
        {error || 'Could not load your files.'}
      </Banner>
    );
  } else if (files.length === 0) {
    body = hasFilters ? (
      <EmptyState
        icon="search"
        title={query ? `No results for "${query}"` : 'No files in this category'}
        text={query ? 'Check the spelling or try a shorter search.' : 'Choose another category or view all files.'}
        action={<Button variant="secondary" onClick={() => update({ query: '', category: '', page: 1 })}>{query ? 'Clear search' : 'Show all files'}</Button>}
      />
    ) : (
      <EmptyState
        icon="upload" title="No files yet" text="Upload your first file to see it here."
        action={<Link to="/upload" className="btn btn-primary">Upload file</Link>}
      />
    );
  } else {
    body = (
      <div style={{ opacity: status === 'loading' ? 0.6 : 1 }} aria-busy={status === 'loading'}>
        <FileList files={sorted} sort={sort} onSort={onSort} onDownload={onDownload} onShare={onShare} downloadingId={downloadingId} />
        <Pager pagination={pagination} disabled={status === 'loading'} onPage={(p) => { update({ page: p }); window.scrollTo({ top: 0 }); }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1>My files</h1>
        <Link to="/upload" className="btn btn-primary"><Icon name="upload" size={16} /> Upload file</Link>
      </div>

      {categories.length > 0 && (
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const on = c.category.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={c.label} type="button" aria-pressed={on} onClick={() => update({ category: c.category, page: 1 })}
                className="btn btn-sm max-w-full"
                style={on ? { background: 'var(--tint)', color: 'var(--primary)', borderColor: 'var(--primary)' } : { background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--line)' }}
              >
                <span className="truncate" title={c.label}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {query && status !== 'error' && (
        <p className="caption" style={{ fontSize: 13 }}>
          Searching for "{query}". <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ query: '', page: 1 })}>Clear search</button>
        </p>
      )}

      <div aria-live="polite" className="contents">{body}</div>
    </div>
  );
}
