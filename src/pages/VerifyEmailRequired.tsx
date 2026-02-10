import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './VerifyEmailRequired.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const COOLDOWN_SECONDS = 30;

const VerifyEmailRequired: React.FC = () => {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(emailFromState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const startCooldown = useCallback(() => {
    setCooldownLeft(COOLDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = email.trim().toLowerCase();
    if (!emailToUse) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessage(data.message || 'Verification email sent. Check your inbox.');
        startCooldown();
      } else if (res.status === 429) {
        const wait = data.retryAfterSeconds ?? COOLDOWN_SECONDS;
        setCooldownLeft(wait);
        setError(data.error || 'Please wait before requesting another email.');
      } else {
        setError(data.error || 'Failed to send verification email.');
      }
    } catch {
      setError('Unable to reach server. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-required-container">
      <div className="verify-required-card">
        <div className="verify-required-header">
          <h1>Email not verified</h1>
          <p>
            Your account is not verified yet. We sent a verification link to your email.
            You can request a new link below.
          </p>
        </div>
        <form onSubmit={handleResend} className="verify-required-form">
          <div className="form-group">
            <label htmlFor="verify-required-email">Email address</label>
            <input
              id="verify-required-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@techforcerobotics.com"
              disabled={!!emailFromState}
              autoComplete="email"
            />
          </div>
          {message && <div className="verify-required-message">{message}</div>}
          {error && <div className="verify-required-error">{error}</div>}
          <button
            type="submit"
            className="verify-required-button"
            disabled={loading || cooldownLeft > 0}
          >
            {loading
              ? 'Sending...'
              : cooldownLeft > 0
                ? `Resend verification email (${cooldownLeft}s)`
                : 'Resend verification email'}
          </button>
        </form>
        <div className="verify-required-footer">
          <Link to="/login" className="verify-required-link">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailRequired;
