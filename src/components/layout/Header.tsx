import React from 'react';
import { useStopwatchState } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { TabBar } from './TabBar';

export function Header() {
  const { stopwatch } = useStopwatchState();

  return (
    <header className="app-header">
      <div className="brand-group">
        <div className="brand-logo" aria-hidden="true">
          <Icon name="pool" size={24} />
        </div>
        <div className="brand-text">
          <span className="brand-title">DeckGala</span>
          <span className="brand-subtitle">Club Coach Timer</span>
        </div>
      </div>

      <TabBar />

      <div className="header-actions">
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

