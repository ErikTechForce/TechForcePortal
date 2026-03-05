import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import './Sidebar.css';

interface MenuItem {
  label: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const layout = useLayout();
  const isOpen = layout?.mobileMenuOpen ?? false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const closeMobileMenuRef = useRef(layout?.closeMobileMenu);
  closeMobileMenuRef.current = layout?.closeMobileMenu;

  /* Close menu only when route changes (user navigated), not when context reference changes */
  useEffect(() => {
    closeMobileMenuRef.current?.();
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') layout?.closeMobileMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, layout]);

  const mainMenuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Orders', path: '/orders' },
    { label: 'Tasks Board', path: '/tasks' },
    { label: 'Client', path: '/client' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Robots', path: '/robots' },
  ];

  const settingsMenuItem: MenuItem = { label: 'Settings', path: '/settings' };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-topbar-toggle"
          onClick={layout?.toggleMobileMenu}
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          ☰
        </button>
      </div>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={layout?.closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <h1 className="sidebar-brand-text">TechForce Robotics Portal</h1>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {mainMenuItems.map((item) => (
              <li key={item.path} className="sidebar-menu-item">
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="sidebar-menu sidebar-menu-bottom">
            <li className="sidebar-menu-item">
              <Link
                to={settingsMenuItem.path}
                className={`sidebar-link ${isActive(settingsMenuItem.path) ? 'active' : ''}`}
              >
                {settingsMenuItem.label}
              </Link>
            </li>
            <li className="sidebar-menu-item">
              <button type="button" className="sidebar-logout" onClick={handleLogout}>
                Log out
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;


