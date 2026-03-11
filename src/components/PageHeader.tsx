import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, onBack, backLabel }) => {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h2 className="page-header-title">{title}</h2>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      <div className="page-header-right">
        {action && <div className="page-header-action">{action}</div>}
        {onBack && (
          <button type="button" className="page-header-back-btn" onClick={onBack}>
            {backLabel ?? 'Back'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
