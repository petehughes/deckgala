import React from 'react';
import { useApp } from '../../context/AppContext';
import type { SwimmerGroup } from '../../types';

export interface GroupListProps {
  onNewGroup: () => void;
  onEditGroup: (group: SwimmerGroup) => void;
  onDeleteGroup: (group: SwimmerGroup) => void;
}

export function GroupList({ onNewGroup, onEditGroup, onDeleteGroup }: GroupListProps) {
  const { club, activeGroupId, setActiveGroupId, config } = useApp();

  return (
    <aside className="groups-sidebar">
      <div className="groups-sidebar-header">
        <span className="groups-sidebar-title">SWIMMING GROUPS</span>
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={onNewGroup}
        >
          + Add Group
        </button>
      </div>

      <div className="groups-list" role="listbox" aria-label="Swimming Groups">
        {club.groups.length === 0 ? (
          <div className="groups-empty-sidebar">
            <p>No squads yet.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onNewGroup}
            >
              + Create First Squad
            </button>
          </div>
        ) : (
          club.groups.map(grp => {
            const isActive = grp.id === activeGroupId;
            const inSession = config.selectedGroupIds.includes(grp.id);
            return (
              <div
                key={grp.id}
                role="option"
                aria-selected={isActive}
                tabIndex={0}
                className={`group-list-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveGroupId(grp.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveGroupId(grp.id);
                  }
                }}
              >
                <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                <div className="group-item-main">
                  <div className="group-item-top">
                    <span className="group-item-name">{grp.name}</span>
                    <span className="group-item-count">{grp.swimmers.length}</span>
                  </div>
                  <div className="group-item-bottom">
                    <span className="group-item-coach">
                      {grp.coach || grp.description || 'No coach listed'}
                    </span>
                    {inSession && (
                      <span
                        className="group-session-tag"
                        title="Selected for current session"
                      >
                        In Session
                      </span>
                    )}
                  </div>
                </div>
                <div className="group-item-hover-actions">
                  <button
                    type="button"
                    className="group-mini-btn"
                    title="Edit group"
                    onClick={e => {
                      e.stopPropagation();
                      onEditGroup(grp);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="group-mini-btn danger"
                    title="Delete group"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteGroup(grp);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

