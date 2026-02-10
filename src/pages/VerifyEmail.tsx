import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './VerifyEmail.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const requestSentRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification link. Check your email for the correct link.');
      return;
    }
    if (requestSentRef.current) return;
    requestSentRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!mountedRef.current) return;
        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified. You can sign in now.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
        }
      } catch {
        if (mountedRef.current) {
          setStatus('error');
          setMessage('Unable to reach server. Try again later.');
        }
      }
    })();
  }, [token]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className="verify-email-header">
          <h1>Email verification</h1>
          <p>
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
        </div>
        {status === 'loading' && <div className="verify-email-spinner" aria-hidden="true" />}
        {(status === 'success' || status === 'error') && (
          <Link to="/login" className="verify-email-button">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
