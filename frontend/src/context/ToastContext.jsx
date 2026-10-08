/** Toast context: transient messages (ok, warn, err), auto-dismiss after about 5 seconds, aria-live polite. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const BAR = { ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)' };
const ICON = { ok: 'check', warn: 'alert', err: 'alert' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push('ok', m),
    warning: (m) => push('warn', m),
    error: (m) => push('err', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[70] bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex flex-col gap-2 items-center sm:items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 w-full sm:w-auto sm:min-w-[280px] max-w-md bg-surface border border-line rounded pr-2 py-3 pl-0 shadow-lg overflow-hidden"
          >
            <span className="self-stretch w-1 rounded-full ml-0" style={{ background: BAR[t.type] }} aria-hidden="true" />
            <span style={{ color: BAR[t.type] }} className="mt-0.5"><Icon name={ICON[t.type]} size={18} /></span>
            <p className="flex-1 text-sm">{t.message}</p>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--muted)' }} aria-label="Dismiss message" onClick={() => dismiss(t.id)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
