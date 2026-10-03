/**
 * App shell for private screens: 230 px sticky sidebar (nav + categories), top bar (menu button, search,
 * theme toggle, avatar menu). Under 760 px the sidebar becomes a slide-in drawer.
 * The top-bar search writes to the dashboard URL (?query=) so it works from any screen.
 */
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from './Icon.jsx';
import Wordmark from './Wordmark.jsx';
import { Avatar, Skeleton } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCategories } from '../context/CategoriesContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { initials } from '../utils/format.js';

function navCls({ isActive }) {
  return `flex items-center gap-2.5 px-3 h-9 rounded text-sm font-medium no-underline ${isActive ? 'bg-tint text-primary' : 'text-ink hover:bg-canvas'}`;
}

function Sidebar({ onNavigate }) {
  const { categories, loading, error, refresh } = useCategories();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeCat = location.pathname === '/' ? (params.get('category') || '') : null;

  function pick(cat) {
    const qs = new URLSearchParams();
    if (cat) qs.set('category', cat);
    navigate({ pathname: '/', search: qs.toString() ? `?${qs}` : '' });
    onNavigate?.();
  }

  return (
    <div className="flex flex-col h-full p-4 gap-5 overflow-y-auto">
      <div className="px-1 pt-1"><Wordmark /></div>
      <nav aria-label="Main" className="flex flex-col gap-1">
        <NavLink to="/" end className={navCls} onClick={onNavigate}><Icon name="folder" /> My files</NavLink>
        <NavLink to="/upload" className={navCls} onClick={onNavigate}><Icon name="upload" /> Upload</NavLink>
        <NavLink to="/account" className={navCls} onClick={onNavigate}><Icon name="user" /> Account</NavLink>
      </nav>
      <div>
        <h2 className="!text-xs !font-semibold uppercase tracking-wide px-3 mb-2" style={{ color: 'var(--muted)', fontFamily: 'Figtree, system-ui, sans-serif' }}>Categories</h2>
        {loading && !categories.length ? (
          <div className="flex flex-col gap-2 px-3"><Skeleton className="h-5" /><Skeleton className="h-5" /></div>
        ) : error ? (
          <div className="px-3 text-sm">
            <p style={{ color: 'var(--err)' }}>Could not load categories.</p>
            <button type="button" className="btn btn-ghost btn-sm mt-1 -ml-3" onClick={refresh}>Retry</button>
          </div>
        ) : categories.length === 0 ? (
          <p className="caption px-3">No categories yet.</p>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {categories.map((c) => {
              const on = activeCat !== null && activeCat.toLowerCase() === c.category.toLowerCase();
              return (
                <li key={c.category}>
                  <button
                    type="button" onClick={() => pick(c.category)} aria-current={on ? 'true' : undefined}
                    className={`w-full flex items-center justify-between gap-2 px-3 h-9 rounded text-sm text-left cursor-pointer border-0 ${on ? 'bg-tint text-primary font-semibold' : 'bg-transparent text-ink hover:bg-canvas'}`}
                  >
                    <span className="truncate" title={c.category}>{c.category}</span>
                    <span className="caption shrink-0">{c.file_count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button" className="rounded-full border-0 bg-transparent p-0 cursor-pointer" aria-haspopup="menu" aria-expanded={open}
        aria-label="Account menu" onClick={() => setOpen((o) => !o)}
      >
        <Avatar text={initials(user?.name)} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 card !p-1 z-40 shadow-lg">
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="caption truncate">{user?.email}</p>
          </div>
          <button role="menuitem" type="button" className="w-full flex items-center gap-2 px-3 h-9 rounded text-sm text-left bg-transparent border-0 cursor-pointer text-ink hover:bg-canvas" onClick={() => { setOpen(false); navigate('/account'); }}>
            <Icon name="user" size={16} /> Account
          </button>
          <button role="menuitem" type="button" className="w-full flex items-center gap-2 px-3 h-9 rounded text-sm text-left bg-transparent border-0 cursor-pointer text-ink hover:bg-canvas" onClick={() => { setOpen(false); logout(); }}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function TopSearch() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const urlQuery = location.pathname === '/' ? params.get('query') || '' : '';
  const [value, setValue] = useState(urlQuery);
  const lastPushed = useRef(urlQuery);

  // Keep the field in sync when the URL changes elsewhere (clear search, back button).
  useEffect(() => { setValue(urlQuery); lastPushed.current = urlQuery; }, [urlQuery]);

  // Debounce 300 ms before writing to the URL; the dashboard then cancels and re-requests.
  useEffect(() => {
    if (value === lastPushed.current) return undefined;
    const t = setTimeout(() => {
      lastPushed.current = value;
      const qs = new URLSearchParams(location.pathname === '/' ? params : undefined);
      if (value) qs.set('query', value); else qs.delete('query');
      qs.delete('page');
      navigate({ pathname: '/', search: qs.toString() ? `?${qs}` : '' });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form role="search" className="relative flex-1 max-w-md" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="top-search" className="sr-only-live">Search files by name</label>
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><Icon name="search" size={16} /></span>
      <input
        id="top-search" type="search" className="input pl-9" placeholder="Search files by name" value={value}
        onChange={(e) => setValue(e.target.value)} autoComplete="off"
      />
    </form>
  );
}

export default function AppShell() {
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const menuBtn = useRef(null);

  useEffect(() => { setDrawer(false); }, [location.pathname]);

  // Drawer: Escape closes, focus moves in on open and back to the menu button on close.
  useEffect(() => {
    if (!drawer) return undefined;
    const prev = document.activeElement;
    const first = drawerRef.current?.querySelector('a, button');
    first?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); (menuBtn.current || prev)?.focus?.(); };
  }, [drawer]);

  return (
    <div className="min-h-screen">
      <style>{`
        @media (min-width: 760px) { .shell-grid { display: grid; grid-template-columns: 230px minmax(0, 1fr); } .shell-side { display: block !important; } .shell-menu { display: none !important; } }
      `}</style>
      <div className="shell-grid min-h-screen">
        <aside className="shell-side hidden sticky top-0 h-screen bg-surface border-r border-line" aria-label="Sidebar">
          <Sidebar />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(8,16,20,.55)' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
            <aside ref={drawerRef} className="h-full w-[260px] max-w-[85vw] bg-surface border-r border-line relative" aria-label="Navigation drawer">
              <button type="button" className="btn btn-ghost btn-icon btn-sm absolute right-2 top-2" style={{ color: 'var(--muted)' }} aria-label="Close menu" onClick={() => setDrawer(false)}>
                <Icon name="close" size={16} />
              </button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        <div className="min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-canvas border-b border-line" style={{ paddingInline: 'clamp(16px, 4vw, 48px)' }}>
            <button ref={menuBtn} type="button" className="shell-menu btn btn-secondary btn-icon" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <Icon name="menu" />
            </button>
            <TopSearch />
            <div className="ml-auto flex items-center gap-2">
              <button type="button" className="btn btn-secondary btn-icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
              </button>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1" style={{ padding: '36px clamp(16px, 4vw, 48px) 80px' }}>
            <div className="mx-auto w-full" style={{ maxWidth: 980 }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
