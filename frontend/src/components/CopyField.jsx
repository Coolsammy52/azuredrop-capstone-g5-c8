/** Read-only input with a ghost Copy button that briefly says "Copied". Uses clipboard API with a fallback. */
import { useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Copy text; returns true on success. Fallback uses a hidden textarea and execCommand. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through to the fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

/** Hook: copy with toast feedback. */
export function useCopy() {
  const toast = useToast();
  return async (text) => {
    const ok = await copyText(text);
    if (ok) toast.success('Link copied to clipboard.');
    else toast.error('Could not copy. Select the link and copy it manually.');
    return ok;
  };
}

export default function CopyField({ value, label = 'Share link' }) {
  const id = useId();
  const copy = useCopy();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  async function onCopy() {
    const ok = await copy(value);
    if (ok) { setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1800); }
  }
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="flex gap-2">
        <input id={id} className="input" readOnly value={value} onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn-ghost" onClick={onCopy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
