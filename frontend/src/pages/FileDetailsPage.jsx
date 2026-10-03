/**
 * File details: metadata, inline category editing, blob download, and the share-links panel
 * (create with expiry presets, copy, list, revoke with confirmation).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Dialog from '../components/Dialog.jsx';
import CopyField, { useCopy } from '../components/CopyField.jsx';
import { Badge, Banner, Button, EmptyState, FileChip, Skeleton } from '../components/ui.jsx';
import { downloadFile, getMetadata, updateCategory } from '../api/files.js';
import { createShare, listShares, revokeShare } from '../api/shares.js';
import { useCategories } from '../context/CategoriesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatBytes, formatDateTime, shareUrl, truncateToken } from '../utils/format.js';

const PRESETS = [
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '24 hours', minutes: 1440 },
  { label: '7 days', minutes: 10080 },
];

function SharePanel({ fileId }) {
  const toast = useToast();
  const copy = useCopy();
  const [minutes, setMinutes] = useState(60);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated] = useState(null);
  const [state, setState] = useState({ status: 'loading', shares: [], error: '' });
  const [toRevoke, setToRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async (signal) => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const d = await listShares(fileId, signal);
      setState({ status: 'ready', shares: d.shares || [], error: '' });
    } catch (e) {
      if (e.name === 'AbortError') return;
      setState({ status: 'error', shares: [], error: e.message });
    }
  }, [fileId]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  async function onCreate() {
    if (creating) return;
    setCreating(true); setCreateError('');
    try {
      const d = await createShare(fileId, minutes);
      setCreated(d);
      toast.success('Share link created.');
      load();
    } catch (e) {
      if (e.status !== 401) setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function confirmRevoke() {
    if (!toRevoke || revoking) return;
    setRevoking(true);
    try {
      await revokeShare(toRevoke.share_token);
      setState((s) => ({ ...s, shares: s.shares.filter((x) => x.share_token !== toRevoke.share_token) }));
      if (created && created.share_token === toRevoke.share_token) setCreated(null);
      toast.success('Share link revoked.');
      setToRevoke(null);
    } catch (e) {
      if (e.status === 404) { // already gone: drop the row
        setState((s) => ({ ...s, shares: s.shares.filter((x) => x.share_token !== toRevoke.share_token) }));
        setToRevoke(null);
      } else if (e.status !== 401) toast.error(e.message);
    } finally {
      setRevoking(false);
    }
  }

  return (
    <section id="share" className="card" aria-labelledby="share-heading">
      <h3 id="share-heading">Share links</h3>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Anyone with an active link can download this file without logging in.</p>

      <div className="mt-4 flex items-end gap-2 flex-wrap">
        <div>
          <label htmlFor="expiry" className="field-label">Link expires after</label>
          <select id="expiry" className="input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} style={{ width: 'auto', minWidth: 160 }}>
            {PRESETS.map((p) => <option key={p.minutes} value={p.minutes}>{p.label}</option>)}
          </select>
        </div>
        <Button variant="secondary" loading={creating} onClick={onCreate}><Icon name="link" size={16} /> Create share link</Button>
      </div>
      {createError && <div className="mt-3"><Banner type="err">{createError}</Banner></div>}

      {created && (
        <div className="mt-4 p-3 rounded" style={{ background: 'var(--tint)' }}>
          <CopyField value={shareUrl(created.share_token)} label="New share link" />
          <p className="caption mt-2">Expires {formatDateTime(created.expires_at)}</p>
        </div>
      )}

      <div className="mt-5" aria-live="polite">
        {state.status === 'loading' && <div className="flex flex-col gap-2" role="status"><span className="sr-only-live">Loading share links</span><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
        {state.status === 'error' && (
          <Banner type="err" action={<Button size="sm" variant="secondary" onClick={() => load()}>Retry</Button>}>{state.error}</Banner>
        )}
        {state.status === 'ready' && state.shares.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No share links yet.</p>}
        {state.status === 'ready' && state.shares.length > 0 && (
          <ul className="list-none m-0 p-0 flex flex-col">
            {state.shares.map((s) => (
              <li key={s.share_token} className="flex items-center justify-between gap-3 flex-wrap py-3 border-t border-line first:border-t-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm" title={s.share_token}>{truncateToken(s.share_token)}</code>
                    <Badge type={s.expired ? 'expired' : 'active'}>{s.expired ? 'Expired' : 'Active'}</Badge>
                  </div>
                  <p className="caption mt-0.5">Created {formatDateTime(s.created_at)} · Expires {formatDateTime(s.expires_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!s.expired && <Button size="sm" variant="ghost" onClick={() => copy(shareUrl(s.share_token))} aria-label={`Copy link ${truncateToken(s.share_token)}`}><Icon name="copy" size={14} /> Copy</Button>}
                  <Button size="sm" variant="secondary" onClick={() => setToRevoke(s)} aria-label={`Revoke link ${truncateToken(s.share_token)}`}>Revoke</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={Boolean(toRevoke)} title="Revoke this share link?" onClose={() => { if (!revoking) setToRevoke(null); }}
        footer={<><Button variant="secondary" onClick={() => setToRevoke(null)} disabled={revoking}>Keep link</Button><Button variant="danger" loading={revoking} onClick={confirmRevoke}>Revoke link</Button></>}
      >
        Anyone who opens this link will see that it was revoked. This cannot be undone.
      </Dialog>
    </section>
  );
}

export default function FileDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const { refresh } = useCategories();
  const [state, setState] = useState({ status: 'loading', file: null, error: '' });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [catError, setCatError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState('');
  const scrolled = useRef(false);

  const load = useCallback((signal) => {
    setState({ status: 'loading', file: null, error: '' });
    getMetadata(id, signal)
      .then((d) => setState({ status: 'ready', file: d.file, error: '' }))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setState({ status: e.status === 404 ? 'notfound' : 'error', file: null, error: e.message });
      });
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    scrolled.current = false;
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Arriving from the dashboard "Share" action: scroll to the share panel.
  useEffect(() => {
    if (state.status === 'ready' && location.hash === '#share' && !scrolled.current) {
      scrolled.current = true;
      document.getElementById('share')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.status, location.hash]);

  async function saveCategory(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setCatError('');
    try {
      const d = await updateCategory(id, draft.trim()); // empty string resets to "other" on the server
      setState((s) => ({ ...s, file: { ...s.file, ...d.file } }));
      setEditing(false);
      toast.success('Category updated.');
      refresh(); // sidebar counts
    } catch (err) {
      if (err.status !== 401) setCatError(err.message); // old value stays visible
    } finally {
      setSaving(false);
    }
  }

  async function onDownload() {
    if (downloading) return;
    setDownloading(true); setDlError('');
    try {
      await downloadFile(state.file.id, state.file.filename);
      toast.success('Download started.');
    } catch (e) {
      if (e.status !== 401) setDlError(e.status === 404 ? 'File not found. It may have been moved.' : e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (state.status === 'loading') {
    return <div className="flex flex-col gap-4" role="status"><span className="sr-only-live">Loading file</span><Skeleton className="h-4 w-48" /><Skeleton className="h-9 w-2/3" /><Skeleton className="h-40" /></div>;
  }
  if (state.status === 'notfound') {
    return <EmptyState icon="file" title="File not found" text="File not found. It may have been moved or it may not be yours." action={<Link to="/" className="btn btn-secondary">Back to my files</Link>} />;
  }
  if (state.status === 'error') {
    return <Banner type="err" action={<Button size="sm" variant="secondary" onClick={() => load()}>Retry</Button>}>{state.error}</Banner>;
  }

  const f = state.file;
  const rows = [
    ['Type', <FileChip key="c" fileType={f.file_type} filename={f.filename} />],
    ['Size', formatBytes(f.file_size)],
    ['Uploaded', formatDateTime(f.uploaded_at)],
    ['Uploaded by', f.uploader && f.uploader.name ? f.uploader.name : 'Unknown'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-sm flex items-center gap-1.5 min-w-0">
        <Link to="/">My files</Link><span style={{ color: 'var(--muted)' }} aria-hidden="true">/</span>
        <span className="truncate" title={f.filename} aria-current="page">{f.filename}</span>
      </nav>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="min-w-0 break-words !text-[26px] sm:!text-[32px]" style={{ overflowWrap: 'anywhere' }} title={f.filename}>{f.filename}</h1>
        <Button variant="primary" loading={downloading} onClick={onDownload}>{!downloading && <Icon name="download" size={16} />} Download</Button>
      </div>
      {dlError && <Banner type="err">{dlError}</Banner>}

      <section className="card" aria-label="File information">
        <dl className="m-0 grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: 'minmax(90px, auto) minmax(0, 1fr)' }}>
          {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="caption self-center">{k}</dt><dd className="m-0 text-sm">{v}</dd></div>))}
          <dt className="caption self-center">Category</dt>
          <dd className="m-0 text-sm">
            {editing ? (
              <form onSubmit={saveCategory} className="flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap items-center">
                  <label htmlFor="cat-edit" className="sr-only-live">Category</label>
                  <input id="cat-edit" className="input" style={{ maxWidth: 260 }} value={draft} maxLength={50} autoFocus onChange={(e) => setDraft(e.target.value)} aria-invalid={catError ? 'true' : undefined} aria-describedby={catError ? 'cat-err' : 'cat-help'} />
                  <Button type="submit" size="sm" variant="primary" loading={saving}>Save</Button>
                  <Button size="sm" variant="secondary" disabled={saving} onClick={() => { setEditing(false); setCatError(''); }}>Cancel</Button>
                </div>
                {catError ? <p id="cat-err" className="field-error !mt-0" role="alert">{catError}</p> : <p id="cat-help" className="field-help !mt-0">Up to 50 characters. Leave empty to reset to “other”.</p>}
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{f.category}</Badge>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(f.category === 'other' ? '' : f.category); setEditing(true); setCatError(''); }}>Edit category</Button>
              </div>
            )}
          </dd>
        </dl>
      </section>

      <SharePanel fileId={f.id} />
    </div>
  );
}
