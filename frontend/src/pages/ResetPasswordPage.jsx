/** Choose a new password using ?token=. Missing or rejected tokens show an error state with a link to request a new one. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import { Banner, Button, PasswordField } from '../components/ui.jsx';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const BadLink = (
    <AuthLayout title="Reset link problem">
      <Banner type="err">This link is invalid or has expired.</Banner>
      <p className="text-sm mt-4"><Link to="/forgot-password">Request a new reset link</Link></p>
    </AuthLayout>
  );

  if (!token || invalid) return BadLink;

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <Banner type="ok">Your password has been changed. Log in with your new password.</Banner>
        <Button variant="primary" size="lg" className="w-full mt-5" onClick={() => navigate('/login', { replace: true })}>Log in</Button>
      </AuthLayout>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setFormError('');
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    setError('');
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      // 400 covers invalid, expired, used or replaced links; a short password is caught above.
      if (err.status === 400) setInvalid(true); else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Banner type="err">{formError}</Banner>}
        <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} help="Use at least 8 characters." />
        <Button type="submit" variant="primary" size="lg" loading={busy}>{busy ? 'Saving' : 'Save new password'}</Button>
      </form>
    </AuthLayout>
  );
}
