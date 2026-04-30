import React from 'react';
import './Navigation.css';

interface NavigationProps {
  currentPage: 'dashboard' | 'charts' | 'history';
  onPageChange: (page: 'dashboard' | 'charts' | 'history') => void;
  onResetProfile: () => void;
  profileName: string;
  darkMode: boolean;
  onToggleDark: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
  onResetProfile,
  profileName,
  darkMode,
  onToggleDark,
}) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>⚖️ Weight Tracker</h2>
          <span className="user-name">{profileName}</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onPageChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-link ${currentPage === 'charts' ? 'active' : ''}`}
            onClick={() => onPageChange('charts')}
          >
            Charts
          </button>
          <button
            className={`nav-link ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => onPageChange('history')}
          >
            History
          </button>
        </div>

        <div className="nav-actions">
          <button
            className="dark-toggle-btn"
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="reset-btn" onClick={onResetProfile} title="Reset profile and start over">
            Reset
          </button>
        </div>
      </div>
    </nav>
  );
};
