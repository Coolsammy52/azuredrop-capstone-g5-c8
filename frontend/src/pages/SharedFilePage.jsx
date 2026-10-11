/**
 * Public shared-file page (/s/:token). No login, no Authorization header, no app shell.
 * The download_url lives about 10 minutes, so if it has expired by the time the user clicks,
 * we fetch a fresh one first.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { Badge, Banner, Button, EmptyState, FileChip, Skeleton } from '../components/ui.jsx';
import { getPublicShare } from '../api/shares.js';
import { formatBytes, formatDateTime } from '../utils/format.js';

export default function SharedFilePage() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [busy, setBusy] = useState(false);
  const [dlError, setDlError] = useState('');

  const load = useCallback((signal) => {
    setState({ status: 'loading', data: null, error: '' });
    getPublicShare(token, signal)
      .then((data) => setState({ status: 'ready', data, error: '' }))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        const status = e.status === 410 ? 'expired' : e.status === 404 ? 'notfound' : 'error';
        setState({ status, data: null, error: e.message });
      });
  }, [token]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  async function onDownload() {
    if (busy) return;
    setBusy(true); setDlError('');
    try {
      let { download_url: url, download_url_expires_at: exp } = state.data;
      // Stale link (or about to expire within 5 s): get a fresh one before navigating.
      if (!exp || new Date(exp).getTime() - Date.now() < 5000) {
        const fresh = await getPublicShare(token);
        setState((s) => ({ ...s, data: fresh }));
        url = fresh.download_url;
      }
      window.location.assign(url);
    } catch (e) {
      if (e.status === 410) setState({ status: 'expired', data: null, error: '' });
      else if (e.status === 404) setState({ status: 'notfound', data: null, error: '' });
      else setDlError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <AuthLayout wide>
        <div className="flex flex-col gap-3" role="status"><span className="sr-only-live">Loading shared file</span>
          <Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-32" />
        </div>
      </AuthLayout>
    );
  }
  if (state.status === 'expired' || state.status === 'notfound') {
    return (
      <AuthLayout wide>
        <EmptyState icon="link" title={state.status === 'expired' ? 'Link expired' : 'Link not found'}
          text={state.status === 'expired' ? 'This link has expired. Ask the sender for a new one.' : "This link doesn't exist or was revoked."} />
      </AuthLayout>
    );
  }
  if (state.status === 'error') {
    return (
      <AuthLayout wide>
        <Banner type="err" action={<Button size="sm" variant="secondary" onClick={() => load()}><Icon name="refresh" size={14} /> Retry</Button>}>{state.error}</Banner>
      </AuthLayout>
    );
  }

  const { file, share_expires_at: expires } = state.data;
  return (
    <AuthLayout wide>
      <div className="flex items-start gap-3 min-w-0">
        <FileChip fileType={file.file_type} filename={file.filename} />
        <div className="min-w-0">
          <h1 className="!text-[22px] break-words" style={{ overflowWrap: 'anywhere' }} title={file.filename}>{file.filename}</h1>
          <p className="caption mt-1">{formatBytes(file.file_size)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 flex-wrap"><span className="caption">Category</span><Badge>{file.category}</Badge></div>
      <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>This link expires on {formatDateTime(expires)}</p>
      {dlError && <div className="mt-4"><Banner type="err">{dlError}</Banner></div>}
      <Button variant="primary" size="lg" className="w-full mt-5" loading={busy} onClick={onDownload}>{!busy && <Icon name="download" size={16} />} Download</Button>
    </AuthLayout>
  );
}
