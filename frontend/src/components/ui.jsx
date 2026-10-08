/**
 * Small shared UI pieces: Button, Spinner, Skeleton, Banner, Badge, FileChip, Avatar, EmptyState,
 * PasswordInput and TextField. All colours come from design tokens.
 */
import { useId, useState } from 'react';
import Icon from './Icon.jsx';
import { fileChip } from '../utils/files.js';

export function Spinner({ large = false }) {
  return <span className={`spinner${large ? ' spinner-lg' : ''}`} role="presentation" />;
}

/** Button with variants and a loading state (disabled + spinner, so double clicks do nothing). */
export function Button({ variant = 'secondary', size = 'md', loading = false, icon = false, className = '', children, disabled, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '', icon ? 'btn-icon' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

const BANNER = {
  ok: { bg: 'var(--okbg)', fg: 'var(--ok)', icon: 'check' },
  warn: { bg: 'var(--warnbg)', fg: 'var(--warn)', icon: 'alert' },
  err: { bg: 'var(--errbg)', fg: 'var(--err)', icon: 'alert' },
};
/** Inline banner with icon and message. role=alert for errors so screen readers announce it. */
export function Banner({ type = 'err', children, action }) {
  const t = BANNER[type];
  return (
    <div role={type === 'err' ? 'alert' : 'status'} className="flex items-start gap-2 rounded px-3 py-2.5 text-sm" style={{ background: t.bg, color: t.fg }}>
      <span className="mt-0.5 shrink-0"><Icon name={t.icon} size={18} /></span>
      <div className="flex-1 min-w-0">{children}</div>
      {action}
    </div>
  );
}

export function Badge({ type = 'category', children }) {
  const styles = {
    category: { background: 'var(--tint)', color: 'var(--primary)' },
    active: { background: 'var(--okbg)', color: 'var(--ok)' },
    expired: { background: 'var(--errbg)', color: 'var(--err)' },
  };
  return (
    <span className="badge max-w-full" style={styles[type]}>
      {type === 'active' && <Icon name="check" size={12} />}
      {type === 'expired' && <Icon name="close" size={12} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** File-type chip: 28 px square, 6 px radius, 10 px / 600 text. */
export function FileChip({ fileType, filename }) {
  const { label, style } = fileChip(fileType, filename);
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{ width: 28, height: 28, borderRadius: 6, fontSize: 10, fontWeight: 600, ...style }}
      aria-label={`${label} file`}
    >
      {label}
    </span>
  );
}

export function Avatar({ text, size = 32 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: 'var(--tint)', color: 'var(--primary)', fontWeight: 600, fontSize: size <= 24 ? 10 : size >= 40 ? 15 : 12 }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/** Empty state card: 52 px tinted icon tile, heading, one line of muted text, one action. */
export function EmptyState({ icon = 'file', title, text, action }) {
  return (
    <div className="card flex flex-col items-center text-center py-10 px-6">
      <div className="flex items-center justify-center mb-4" style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--tint)', color: 'var(--primary)' }}>
        <Icon name={icon} size={24} />
      </div>
      <h2 className="!text-xl">{title}</h2>
      {text && <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Labelled text input with inline error linked through aria-describedby. */
export function TextField({ label, error, help, id: idProp, className = '', ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  const descId = `${id}-desc`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="input" aria-invalid={error ? 'true' : undefined} aria-describedby={error || help ? descId : undefined} {...rest} />
      {error ? <p id={descId} className="field-error">{error}</p> : help ? <p id={descId} className="field-help">{help}</p> : null}
    </div>
  );
}

/** Password input with a show/hide button. */
export function PasswordField({ label = 'Password', error, help, id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  const descId = `${id}-desc`;
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <input
          id={id} className="input pr-11" type={show ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined} aria-describedby={error || help ? descId : undefined} {...rest}
        />
        <button
          type="button" className="btn btn-ghost btn-icon btn-sm absolute right-1 top-1"
          style={{ color: 'var(--muted)' }}
          onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
        >
          <Icon name={show ? 'eyeoff' : 'eye'} size={16} />
        </button>
      </div>
      {error ? <p id={descId} className="field-error">{error}</p> : help ? <p id={descId} className="field-help">{help}</p> : null}
    </div>
  );
}
