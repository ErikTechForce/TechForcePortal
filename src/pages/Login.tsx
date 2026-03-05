import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const successMessage = (location.state as { message?: string } | null)?.message;
  const fromPath = (location.state as { from?: string } | null)?.from ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data.unverified && data.email) {
          navigate('/verify-email-required', { state: { email: data.email } });
          return;
        }
        setError(data.error || 'Username or password is incorrect.');
        return;
      }
      if (data.success && data.user) {
        login(data.user);
        navigate(fromPath, { replace: true });
      } else {
        setError(data.error || 'Unexpected response from server. Please try again.');
      }
    } catch {
      setError('Unable to reach server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    setIsExiting(true);
    setTimeout(() => navigate('/register'), 320);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`login-container${isExiting ? ' exiting' : ''}`}>

      <div className="login-robot-image-div">
        <img src="/images/robot-logo.svg" alt="Robot" className="login-robot-image" />
      </div>

      <div className="login-card">

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@techforcerobotics.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {successMessage && <div><p className="login-success">{successMessage}</p></div>}
          {error && <div><p className="login-error">{error}</p></div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

        </form>
        
        <div className="login-footer">
          <button type="button" className="link-button" onClick={handleForgotPassword}>
            Forgot Password?
          </button>
          <button
            type="button"
            className="link-button"
            onClick={handleRegister}
          >
            Register
          </button>
        </div>
      </div>

    </div>
  );
};

export default Login;
