import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccess(true);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 80, maxWidth: 400 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Forgot password</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {success ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', borderColor: 'var(--ocean)' }}>
          <h3 style={{ color: 'var(--ocean)', marginBottom: 12 }}>Check your email</h3>
          <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            If an account exists for <b>{email}</b>, we've sent a password reset link.
          </p>
          
          {resetToken && (
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,142,60,0.1)', border: '1px dashed var(--sunset)', borderRadius: 8, textAlign: 'left' }}>
              <p style={{ color: 'var(--sunset)', fontSize: 12, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Demo Note (No Email Server)</p>
              <p style={{ fontSize: 13, marginBottom: 12 }}>In a real application, you would receive an email. For this demo, click the link below to reset your password:</p>
              <Link to={`/reset-password?token=${resetToken}`} style={{ color: 'var(--sunset)', fontSize: 13, wordBreak: 'break-all' }}>
                {window.location.origin}/reset-password?token={resetToken}
              </Link>
            </div>
          )}

          <Link to="/login" className="btn btn-secondary" style={{ marginTop: 24, display: 'inline-flex' }}>Return to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

