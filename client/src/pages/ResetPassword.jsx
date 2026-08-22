import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Invalid reset link</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>The reset token is missing from the URL.</p>
        <Link to="/forgot-password" className="btn btn-primary">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 80, maxWidth: 400 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Set new password</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Enter your new password below.
      </p>

      {success ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', borderColor: 'var(--ocean)' }}>
          <h3 style={{ color: 'var(--ocean)', marginBottom: 12 }}>Password reset successful</h3>
          <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            Your password has been securely updated. You will be redirected to the login page momentarily.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              minLength={6}
            />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={busy}>
            {busy ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}
    </div>
  );
}

