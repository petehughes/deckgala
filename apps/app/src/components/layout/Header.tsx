import React from 'react';
import { useStopwatchState } from '../../context/AppContext';
import logoUrl from '../../assets/logo.svg';
import { Icon } from '../common/Icon';

export interface HeaderProps {
  onOpenMenu?: () => void;
}

export function Header({ onOpenMenu }: HeaderProps = {}) {
  const { stopwatch } = useStopwatchState();

  return (
    <header className="app-header">
      <div className="brand-group">
        <button
          type="button"
          className="hamburger-btn"
          onClick={onOpenMenu}
          aria-label="Open main menu"
          title="Open Menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <div aria-hidden="true">
          <img src={logoUrl} alt="AquaTeamHub" className="brand-logo-img" width="28" height="28" />
        </div>
        <div className="brand-text">
          <span className="brand-title">AquaTeamHub</span>
          <span className="brand-subtitle">Offline Deck Timing</span>
        </div>
      </div>

      <div className="header-actions">
        <div
          className="mesh-status-pill offline"
          title="Peer-to-Peer Mesh: Offline Standalone Mode (Local storage only)"
        >
          <span className="mesh-dot" />
          <span>Offline Standalone</span>
        </div>
        <div
          className={`live-indicator ${stopwatch.isRunning ? 'running' : ''}`}
          title="Stopwatch Status"
        >
          <span className="pulse-dot" />
          <span>{stopwatch.isRunning ? 'RUNNING' : 'IDLE'}</span>
        </div>
      </div>
    </header>
  );
}
