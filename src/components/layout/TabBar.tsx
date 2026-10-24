import React from 'react';
import { useApp } from '../../context/AppContext';
import { getTotalClubSwimmersCount } from '../../lib/roster';
import { Icon } from '../common/Icon';
import type { ViewName } from '../../types';

export function TabBar() {
  const { currentView, setCurrentView, results, club } = useApp();
  const totalSwimmers = getTotalClubSwimmersCount(club);

  const tabs: { id: ViewName; label: string; icon: string; badge?: number }[] = [
    { id: 'setup', label: 'Setup', icon: 'setup' },
    { id: 'swimmers', label: 'Swimmers', icon: 'users', badge: totalSwimmers },
    { id: 'deck', label: 'Pool Deck', icon: 'stopwatch' },
    { id: 'results', label: 'Results', icon: 'results', badge: results.length }
  ];

  return (
    <nav className="main-tabs" role="tablist" aria-label="Primary Views">
      {tabs.map(tab => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentView(tab.id)}
          >
            <Icon name={tab.icon} size={18} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`tab-badge ${tab.id === 'swimmers' ? 'tab-badge-subtle' : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

