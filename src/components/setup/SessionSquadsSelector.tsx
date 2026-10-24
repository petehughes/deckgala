import React from 'react';
import { useApp } from '../../context/AppContext';
import { getSessionPoolSwimmers } from '../../lib/lanes';
import { Icon } from '../common/Icon';

export function SessionSquadsSelector() {
  const {
    club,
    config,
    setCurrentView,
    toggleSessionGroup,
    selectAllSessionGroups,
    clearSessionGroups,
    autoDistributeSwimmers,
    clearAllLanesSwimmers
  } = useApp();

  const poolSwimmers = getSessionPoolSwimmers(club, config.selectedGroupIds);

  return (
    <div className="session-groups-section">
      <div className="section-title-row">
        <div>
          <h2 className="section-heading">Session Squads in the Water</h2>
          <p className="section-sub">
            Select which swimming group(s) are in this session to pick their swimmers into lanes below
          </p>
        </div>
        <div className="bulk-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={selectAllSessionGroups}
          >
            Select All Squads
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearSessionGroups}
          >
            Clear Selection
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentView('swimmers')}
          >
            <Icon name="users" size={14} />
            Manage Swimmers
          </button>
        </div>
      </div>

      {club.groups.length === 0 ? (
        <div className="session-empty-groups">
          <span>No swimming squads created yet.</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCurrentView('swimmers')}
          >
            Create Squads in Swimmers Tab
          </button>
        </div>
      ) : (
        <div className="session-group-Selector">
          {club.groups.map(grp => {
            const isSelected = config.selectedGroupIds.includes(grp.id);
            return (
              <div
                key={grp.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className={`session-group-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSessionGroup(grp.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSessionGroup(grp.id);
                  }
                }}
              >
                <span className="chip-check">{isSelected ? '✓' : ''}</span>
                <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                <div className="chip-info">
                  <span className="chip-name">{grp.name}</span>
                  <span className="chip-meta">
                    {grp.swimmers.length} swimmer{grp.swimmers.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="session-pool-summary">
        <div className="session-pool-meta">
          <span className="session-pool-badge">{poolSwimmers.length}</span>
          <span>swimmers available in selected session squads</span>
        </div>
        <div className="session-pool-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={autoDistributeSwimmers}
            title="Evenly distribute selected squad swimmers across active lanes"
          >
            <Icon name="shuffle" size={14} />
            Auto-Distribute Across Lanes
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearAllLanesSwimmers}
          >
            Clear All Lanes
          </button>
        </div>
      </div>
    </div>
  );
}

