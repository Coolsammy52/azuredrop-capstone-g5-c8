/** Account: name and email from GET /auth/me, plus Log out. */
import { useCallback, useEffect, useState } from 'react';
import * as authApi from '../api/auth.js';
import { Avatar, Banner, Button, Skeleton } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, initials } from '../utils/format.js';

export default function AccountPage() {
  const { logout } = useAuth();
  const [state, setState] = useState({ status: 'loading', user: null, error: '' });

  const load = useCallback((signal) => {
    setState({ status: 'loading', user: null, error: '' });
    authApi.me(signal)
      .then((d) => setState({ status: 'ready', user: d.user, error: '' }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ status: 'error', user: null, error: e.message }); });
  }, []);

  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 520 }}>
      <h1>Account</h1>
      {state.status === 'loading' && <div className="card flex flex-col gap-3" role="status"><span className="sr-only-live">Loading account</span><Skeleton className="h-10 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>}
      {state.status === 'error' && <Banner type="err" action={<Button size="sm" variant="secondary" onClick={() => load()}>Retry</Button>}>{state.error}</Banner>}
      {state.status === 'ready' && (
        <section className="card flex items-center gap-4" aria-label="Your details">
          <Avatar text={initials(state.user.name)} size={40} />
          <div className="min-w-0">
            <p className="font-semibold truncate">{state.user.name}</p>
            <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>{state.user.email}</p>
            {state.user.created_at && <p className="caption mt-1">Member since {formatDate(state.user.created_at)}</p>}
          </div>
        </section>
      )}
      <div><Button variant="secondary" onClick={logout}>Log out</Button></div>
    </div>
  );
}
