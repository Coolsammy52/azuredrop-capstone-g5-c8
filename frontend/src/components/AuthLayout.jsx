/** Centered card on the canvas colour with the wordmark above it. Used by auth screens and the public share page. */
import Wordmark from './Wordmark.jsx';

export default function AuthLayout({ title, subtitle, children, wide = false }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6"><Wordmark asLink={false} /></div>
      <div className="card w-full" style={{ maxWidth: wide ? 520 : 420, padding: 24 }}>
        {title && <h1 className="!text-[24px] !font-semibold">{title}</h1>}
        {subtitle && <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
        <div className={title ? 'mt-5' : ''}>{children}</div>
      </div>
    </div>
  );
}
