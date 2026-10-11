/**
 * Modal dialog: dimmed overlay, centred card, focus trapped inside, Escape closes,
 * focus returns to the element that opened it.
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Dialog({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  const returnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnRef.current = document.activeElement; // remember the trigger
    const node = ref.current;
    const first = node && node.querySelector(FOCUSABLE);
    if (first) first.focus(); else if (node) node.focus();

    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE));
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0]; const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (returnRef.current && returnRef.current.focus) returnRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(8, 16, 20, .55)' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="card w-full max-w-md" style={{ padding: 20 }}>
        <h3 className="mb-3">{title}</h3>
        <div className="text-sm">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-5">{footer}</div>}
      </div>
    </div>
  );
}
