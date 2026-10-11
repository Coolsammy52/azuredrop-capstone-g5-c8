/** Log in screen. "Keep me signed in" decides localStorage vs sessionStorage; returns the user to where they were going. */
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Banner, Button, PasswordField, TextField } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const notice = location.state?.expired ? 'Your session expired. Log in again.' : location.state?.notice || '';

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const dest = from ? `${from.pathname || '/'}${from.search || ''}` : '/';
  if (user) return <Navigate to={dest} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const next = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next); setFormError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(email.trim(), password, remember);
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Log in" subtitle="Welcome back. Log in to see your files.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {notice && !formError && <Banner type="warn">{notice}</Banner>}
        {formError && <Banner type="err">{formError}</Banner>}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" style={{ accentColor: 'var(--primary)' }} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm">Forgot password?</Link>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={busy}>{busy ? 'Logging in' : 'Log in'}</Button>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>No account yet? <Link to="/signup">Create one</Link></p>
      </form>
    </AuthLayout>
  );
}
