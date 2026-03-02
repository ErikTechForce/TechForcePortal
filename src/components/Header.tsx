import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const layout = useLayout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        {layout && (
          <button
            type="button"
            className="header-menu-toggle"
            onClick={layout.toggleMobileMenu}
            aria-label="Open menu"
            aria-expanded={layout.mobileMenuOpen}
          >
            <span className="header-menu-toggle-icon" aria-hidden>☰</span>
          </button>
        )}
        <h1 className="header-title">TechForce Robotics</h1>
        {user && (
          <div className="header-user">
            <span className="header-user-label">Logged in as {user.username}</span>
            <button type="button" className="header-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;


