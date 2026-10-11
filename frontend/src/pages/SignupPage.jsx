/** Create account. The register call returns no token, so we log in automatically with the same credentials. */
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import { Banner, Button, PasswordField, TextField } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const next = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address, like name@example.com.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    setErrors(next); setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await authApi.register(name.trim(), email.trim(), password);
    } catch (err) {
      if (err.status === 409) setErrors({ email: 'That email is already registered. Log in instead, or use a different email.' });
      else setFormError(err.message);
      setBusy(false);
      return;
    }
    try {
      await login(email.trim(), password, false);
      navigate('/', { replace: true });
    } catch {
      // Account exists but automatic login failed: send the user to log in themselves.
      navigate('/login', { replace: true, state: { notice: 'Account created. Log in to continue.', email: email.trim() } });
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Upload, organise and share files securely.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Banner type="err">{formError}</Banner>}
        <TextField label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField label="Password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} help="Use at least 8 characters." />
        <Button type="submit" variant="primary" size="lg" loading={busy}>{busy ? 'Creating account' : 'Create account'}</Button>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </AuthLayout>
  );
}
