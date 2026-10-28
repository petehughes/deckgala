import React, { useEffect } from 'react';
import { useApp, useStopwatchState } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { playBeep, triggerHapticFeedback } from '../../lib/audio';
import logoUrl from '../../assets/logo.svg';
import type { ViewName, ClubSetupTab } from '../../types';

export interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSessionModal?: () => void;
  onOpenTour?: () => void;
}

interface NavItem {
  id: ViewName;
  label: string;
  sublabel: string;
  icon: string;
}

interface ClubSetupItem {
  tab?: ClubSetupTab;
  view?: ViewName;
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
    id: 'results',
    label: 'Results & Splits',
    sublabel: 'KPI statistics & CSV export',
    icon: 'results'
  }
];

const CLUB_SETUP_ITEMS: ClubSetupItem[] = [
  {
    tab: 'profile',
    label: 'Club Profile & Name',
    sublabel: 'Set club name, code & details',
    icon: 'shield'
  },
  {
    view: 'swimmers',
    label: 'Swimmers & Squads',
    sublabel: 'Rosters, PBs & QR sync',
    icon: 'users'
  },
  {
    tab: 'calendar',
    label: 'Club Calendar',
    sublabel: 'Events, staff covers & closures',
    icon: 'calendar'
  },
  {
    tab: 'sessions',
    label: 'Session Schedules',
    sublabel: 'Weekly & one-off creation',
    icon: 'clock'
  },
  {
    tab: 'staff',
    label: 'Staffing & Coaches',
    sublabel: 'Coaching team & cover allocation',
    icon: 'users'
  },
  {
    tab: 'pools',
    label: 'Pool Setup',
    sublabel: 'Lanes & length facilities',
    icon: 'pool'
  },
  {
    tab: 'targets',
    label: 'Annual Targets & Standards',
    sublabel: 'County, Regional & National quals',
    icon: 'trophy'
  }
];

export function HamburgerMenu({
  isOpen,
  onClose,
  onOpenSessionModal,
  onOpenTour
}: HamburgerMenuProps) {
  const {
    currentView,
    setCurrentView,
    activeClubSetupTab,
    setActiveClubSetupTab,
    config,
    club,
    results
  } = useApp();
  const { stopwatch } = useStopwatchState();

  const pools = club.pools || [];
  const activePool = pools.find(p => p.id === config.selectedPoolId) || pools[0];
  const assignedCoach = (club.coaches || []).find(c => c.id === config.assignedCoachId);
  const coveringCoach = (club.coaches || []).find(c => c.id === config.coveringCoachId);

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

  const handleSelectClubSetup = (tab: ClubSetupTab) => {
    playBeep('pip');
    triggerHapticFeedback();
    setActiveClubSetupTab(tab);
    setCurrentView('club-setup');
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
          {activePool && (
            <div className="drawer-session-pool">
              <Icon name="pool" size={14} />
              <span>{activePool.name} ({activePool.laneCount}L · {activePool.length})</span>
            </div>
          )}
          {assignedCoach && (
            <div className="drawer-session-coach">
              <Icon name="users" size={13} />
              <span>
                {coveringCoach
                  ? `Cover: ${coveringCoach.name} (covering for ${assignedCoach.name})`
                  : `Coach: ${assignedCoach.name}`}
              </span>
            </div>
          )}
          <div className="drawer-session-set">
            <span className="set-label">Set:</span> {config.setName || 'Unlabeled Set'}
          </div>
        </div>

        {/* Deck Navigation Links */}
        <div className="drawer-section-label">TIMING & DECKS</div>
        <nav className="drawer-nav-list" role="navigation" aria-label="Deck Timing Views">
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

        {/* Club Setup Section (User requested dedicated section) */}
        <div className="drawer-section-label">CLUB SETUP</div>
        <div className="drawer-setup-list" role="navigation" aria-label="Club Setup Sections">
          {CLUB_SETUP_ITEMS.map(item => {
            const isActive = item.view
              ? currentView === item.view
              : (currentView === 'club-setup' && activeClubSetupTab === item.tab);

            let badgeText: string | undefined;
            if (item.view === 'swimmers') {
              const total = club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
              badgeText = total > 0 ? `${total} swimmers` : undefined;
            } else if (item.tab === 'calendar' && (club.clubClosures || []).length > 0) {
              badgeText = `${club.clubClosures.length} closures`;
            } else if (item.tab === 'sessions') {
              badgeText = `${(club.scheduledSessions || []).length} slots`;
            } else if (item.tab === 'staff') {
              badgeText = `${(club.coaches || []).length} staff`;
            } else if (item.tab === 'pools') {
              badgeText = `${pools.length} pools`;
            }

            const handleClick = () => {
              if (item.view) {
                handleSelect(item.view);
              } else if (item.tab) {
                handleSelectClubSetup(item.tab);
              }
            };

            return (
              <button
                key={item.label}
                type="button"
                className={`drawer-nav-item setup-item ${isActive ? 'active' : ''}`}
                onClick={handleClick}
              >
                <div className="drawer-nav-icon">
                  <Icon name={item.icon} size={18} />
                </div>
                <div className="drawer-nav-content">
                  <span className="drawer-nav-title">{item.label}</span>
                  <span className="drawer-nav-sub">{item.sublabel}</span>
                </div>
                {badgeText && <span className="drawer-nav-badge">{badgeText}</span>}
              </button>
            );
          })}
        </div>

        {onOpenTour && (
          <div className="drawer-tour-section" style={{ padding: '0.65rem 1.15rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => {
                onClose();
                onOpenTour();
              }}
            >
              <Icon name="compass" size={16} />
              <span>Welcome Guided Tour</span>
            </button>
          </div>
        )}

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
