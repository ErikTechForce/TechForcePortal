import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

interface MenuItem {
  label: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const layout = useLayout();
  const { user } = useAuth();
  const isOpen = layout?.mobileMenuOpen ?? false;
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
    return location.pathname === path;
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={layout?.closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
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
        </ul>
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;


