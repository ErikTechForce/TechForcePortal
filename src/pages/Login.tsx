import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
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
        setError(data.error || 'Login failed.');
        return;
      }
      if (data.success && data.user) {
        login(data.user);
        navigate(fromPath, { replace: true });
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Unable to reach server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Forgot password logic will be implemented later
    console.log('Forgot password clicked');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container">
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

          {successMessage && <div className="login-success">{successMessage}</div>}
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <button 
            type="button" 
            className="link-button"
            onClick={handleForgotPassword}
          >
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
