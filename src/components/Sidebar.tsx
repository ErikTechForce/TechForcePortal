import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface MenuItem {
  label: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const mainMenuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Tasks Board', path: '/tasks' },
    { label: 'Client', path: '/client' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Robots', path: '/robots' },
  ];

  const settingsMenuItem: MenuItem = { label: 'Setting', path: '/setting' };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
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
  );
};

export default Sidebar;


