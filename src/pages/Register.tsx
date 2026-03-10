import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!formData.email.trim().toLowerCase().endsWith('@techforcerobotics.com')) {
      newErrors.email = 'Only @techforcerobotics.com email addresses can register';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Registration failed.');
        return;
      }
      if (data.success) {
        navigate('/login', { state: { message: data.message } });
      } else {
        setSubmitError(data.error || 'Registration failed.');
      }
    } catch {
      setSubmitError('Unable to reach server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsExiting(true);
    setTimeout(() => navigate('/login'), 320);
  };

  return (
    <div className={`register-container${isExiting ? ' exiting' : ''}`}>

      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Sign up to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`form-input${errors.name ? ' error' : ''}`}
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@techforcerobotics.com"
              className={`form-input${errors.email ? ' error' : ''}`}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`form-input${errors.password ? ' error' : ''}`}
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`form-input${errors.confirmPassword ? ' error' : ''}`}
            />
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          {submitError && <div className="register-error">{submitError}</div>}
          
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>Already have an account?</p>
          <button 
            type="button" 
            className="link-button"
            onClick={handleBackToLogin}
          >
            Sign In
          </button>
        </div>
      </div>

      <div className="register-robot-image-div">
        <img src="/images/robot-logo.svg" alt="Robot" className="register-robot-image" />
      </div>
      
    </div>
  );
};

export default Register;
