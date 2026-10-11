/** Request a reset link. Always shows the same success message so we never reveal whether an email is registered. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import { Banner, Button, TextField } from '../components/ui.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setFormError('');
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setError('');
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <Banner type="ok">If that email is registered, we have sent a reset link. It works for 30 minutes.</Banner>
        <p className="text-sm text-center mt-5"><Link to="/login">Back to log in</Link></p>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we will send you a link to choose a new password.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Banner type="err">{formError}</Banner>}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" variant="primary" size="lg" loading={busy}>{busy ? 'Sending' : 'Send reset link'}</Button>
        <p className="text-sm text-center"><Link to="/login">Back to log in</Link></p>
      </form>
    </AuthLayout>
  );
}
