import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import Modal from './Modal';
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
  const { user } = useAuth();
  const isOpen = layout?.mobileMenuOpen ?? false;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const closeMobileMenuRef = useRef(layout?.closeMobileMenu);
  closeMobileMenuRef.current = layout?.closeMobileMenu;

  const isAdmin = Array.isArray(user?.roles) && user!.roles.includes('admin');

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

  const mainMenuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Orders', path: '/orders' },
      { label: 'Tasks Board', path: '/tasks' },
      { label: 'Client', path: '/client' },
      { label: 'Inventory', path: '/inventory' },
      { label: 'Robots', path: '/robots' },
    ];
    if (isAdmin) {
      items.push({ label: 'Employees', path: '/employees' });
    }
    return items;
  }, [isAdmin]);

  const settingsMenuItem: MenuItem = { label: 'Settings', path: '/settings' };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/client') {
      return location.pathname.startsWith('/client') || location.pathname.startsWith('/lead');
    }
    return location.pathname.startsWith(path);
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
          <img src="/images/TechForceLogo-KO+Green-Horizontal.svg" alt="TechForce Robotics" className="sidebar-brand-logo" />
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
              <button type="button" className="sidebar-logout" onClick={() => setConfirmOpen(true)}>
                Log out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Log out"
        narrow
      >
        <div className="modal-body">
          <p style={{ margin: '0 0 1.5rem', color: '#374151', fontSize: '0.9375rem' }}>
            Are you sure you want to log out?
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setConfirmOpen(false)}>
            Cancel
          </button>
          <button type="button" className="sidebar-logout-confirm-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;


