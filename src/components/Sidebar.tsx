import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';
import './Sidebar.css';

interface MenuItem {
  label: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const layout = useLayout();
  const isOpen = layout?.mobileMenuOpen ?? false;

  useEffect(() => {
    layout?.closeMobileMenu();
  }, [location.pathname, layout]);

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


