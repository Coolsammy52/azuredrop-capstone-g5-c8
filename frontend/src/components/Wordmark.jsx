/** Text wordmark: "AzureDrop" in Bricolage Grotesque 700, 20 px (no logo file exists). */
import { Link } from 'react-router-dom';

export default function Wordmark({ to = '/', asLink = true }) {
  const el = (
    <span style={{ fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>
      AzureDrop
    </span>
  );
  return asLink ? <Link to={to} style={{ textDecoration: 'none' }} aria-label="AzureDrop home">{el}</Link> : el;
}
