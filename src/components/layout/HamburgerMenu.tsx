import React, { useEffect } from 'react';
import { useApp, useStopwatchState } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { playBeep, triggerHapticFeedback } from '../../lib/audio';
import logoUrl from '../../assets/logo.svg';
import type { ViewName } from '../../types';

export interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSessionModal?: () => void;
}

interface NavItem {
  id: ViewName;
  label: string;
  sublabel: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'deck',
    label: 'Pool Deck',
    sublabel: 'Stopwatch engine & lane controls',
    icon: 'stopwatch'
  },
  {
    id: 'attendance',
    label: 'Attendance',
    sublabel: 'Mark present / absent swimmers',
    icon: 'attendance'
  },
  {
    id: 'session',
    label: 'Session',
    sublabel: 'Lanes, squads & interval modes',
    icon: 'session'
  },
  {
    id: 'swimmers',
    label: 'Swimmers & Squads',
    sublabel: 'Rosters, PBs & QR sync',
    icon: 'users'
  },
  {
    id: 'results',
    label: 'Results & Splits',
    sublabel: 'KPI statistics & CSV export',
    icon: 'results'
  }
];

export function HamburgerMenu({
  isOpen,
  onClose,
  onOpenSessionModal
}: HamburgerMenuProps) {
  const { currentView, setCurrentView, config, club, results } = useApp();
  const { stopwatch } = useStopwatchState();

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (viewId: ViewName) => {
    playBeep('pip');
    triggerHapticFeedback();
    setCurrentView(viewId);
    onClose();
  };

  const getItemBadge = (id: ViewName) => {
    switch (id) {
      case 'attendance': {
        const count = (config.presentSwimmerIds || []).length;
        return count > 0 ? `${count} present` : undefined;
      }
      case 'swimmers': {
        const total = club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
        return total > 0 ? `${total} swimmers` : undefined;
      }
      case 'results': {
        return results.length > 0 ? `${results.length} splits` : undefined;
      }
      case 'deck': {
        return stopwatch.isRunning ? 'RUNNING' : undefined;
      }
      default:
        return undefined;
    }
  };

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      <div
        className="drawer-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="brand-logo" aria-hidden="true">
              <img src={logoUrl} alt="DeckGala" className="brand-logo-img" width="28" height="28" />
            </div>
            <div className="drawer-brand-text">
              <span className="drawer-brand-title">DeckGala</span>
              <span className="drawer-brand-sub">Offline Deck Timing</span>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Current Active Session Card */}
        <div className="drawer-session-card">
          <div className="drawer-session-header">
            <span className="drawer-section-title">ACTIVE SESSION</span>
            {onOpenSessionModal && (
              <button
                type="button"
                className="drawer-session-edit-btn"
                onClick={() => {
                  onClose();
                  onOpenSessionModal();
                }}
                title="Edit Session Details"
              >
                <Icon name="edit" size={14} />
                <span>Edit</span>
              </button>
            )}
          </div>
          <div className="drawer-session-name">{config.sessionName || 'Morning Training Session'}</div>
          <div className="drawer-session-meta">
            <span>{config.sessionDate}</span>
            <span>·</span>
            <span>{config.sessionTime}</span>
            <span>·</span>
            <span className="drawer-course-tag">{config.poolCourse}</span>
          </div>
          <div className="drawer-session-set">
            <span className="set-label">Set:</span> {config.setName || 'Unlabeled Set'}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="drawer-section-label">NAVIGATION</div>
        <nav className="drawer-nav-list" role="navigation">
          {NAV_ITEMS.map(item => {
            const isActive = currentView === item.id;
            const badge = getItemBadge(item.id);

            return (
              <button
                key={item.id}
                type="button"
                className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <div className="drawer-nav-icon">
                  <Icon name={item.icon} size={20} />
                </div>
                <div className="drawer-nav-content">
                  <span className="drawer-nav-title">{item.label}</span>
                  <span className="drawer-nav-sub">{item.sublabel}</span>
                </div>
                {badge && (
                  <span
                    className={`drawer-nav-badge ${
                      badge === 'RUNNING' ? 'running' : ''
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div className="drawer-footer">
          <div className="drawer-mesh-info">
            <span className="mesh-dot-sm" />
            <span>Peer-to-Peer Mesh: Offline Standalone</span>
          </div>
          <div className="drawer-version-tag">
            <span>DeckGala v2.0.0</span>
            <span>·</span>
            <span>deckgala.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

