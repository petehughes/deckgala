import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { ClubCalendarView } from './ClubCalendarView';
import { SessionScheduleList } from './SessionScheduleList';
import { StaffListView } from './StaffListView';
import { PoolSetupTab } from './PoolSetupTab';
import { ClubProfileTab } from './ClubProfileTab';
import { AnnualTargetsTab } from './AnnualTargetsTab';
import type { ClubSetupTab } from '../../types';

export interface ClubSetupViewProps {
  onOpenTour?: () => void;
}

export function ClubSetupView({ onOpenTour }: ClubSetupViewProps = {}) {
  const { activeClubSetupTab, setActiveClubSetupTab, club } = useApp();

  const currentTab: ClubSetupTab = activeClubSetupTab || 'calendar';

  return (
    <section className="view-panel active club-setup-view" aria-label="Club Setup View">
      {/* Club Setup View Header */}
      <div className="club-setup-banner">
        <div className="banner-left">
          <div className="club-tag-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="club-tag">CLUB SETUP & MANAGEMENT</span>
            {club.shortName && <span className="club-code-pill">{club.shortName}</span>}
            {club.city && <span className="club-location-pill">📍 {club.city}</span>}
          </div>
          <h2 className="club-main-title">{club.clubName}</h2>
          <p className="club-subtitle">
            Configure club identity, weekly training timetables, head coach workout briefings, coaching staff allocation, and holiday closures.
          </p>
        </div>
        <div className="banner-actions">
          {currentTab !== 'profile' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveClubSetupTab('profile')}
              title="Edit club name and settings"
            >
              <Icon name="shield" size={16} />
              <span>Edit Club Profile</span>
            </button>
          )}
          {onOpenTour && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onOpenTour}
              title="Replay 1st-time guided tour"
            >
              <Icon name="compass" size={16} />
              <span>Welcome Tour</span>
            </button>
          )}
        </div>
      </div>

      {/* Setup Sub-navigation Tabs */}
      <div className="club-setup-tabs-bar" role="tablist" aria-label="Club Setup Sections">
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'profile'}
          className={`setup-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('profile')}
        >
          <Icon name="shield" size={18} />
          <span>Club Profile & Name</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'calendar'}
          className={`setup-tab-btn ${currentTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('calendar')}
        >
          <Icon name="calendar" size={18} />
          <span>Club Calendar & Closures</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'sessions'}
          className={`setup-tab-btn ${currentTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('sessions')}
        >
          <Icon name="clock" size={18} />
          <span>Session Schedules & Creation</span>
          <span className="tab-count-pill">{(club.scheduledSessions || []).length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'staff'}
          className={`setup-tab-btn ${currentTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('staff')}
        >
          <Icon name="users" size={18} />
          <span>Staffing & Coaches</span>
          <span className="tab-count-pill">{(club.coaches || []).length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'pools'}
          className={`setup-tab-btn ${currentTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('pools')}
        >
          <Icon name="pool" size={18} />
          <span>Pool Setup</span>
          <span className="tab-count-pill">{(club.pools || []).length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'targets'}
          className={`setup-tab-btn ${currentTab === 'targets' ? 'active' : ''}`}
          onClick={() => setActiveClubSetupTab('targets')}
        >
          <Icon name="trophy" size={18} />
          <span>Annual Targets</span>
          <span className="tab-count-pill">{(club.annualTargets || []).length}</span>
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="club-setup-tab-content">
        {currentTab === 'profile' && <ClubProfileTab onOpenTour={onOpenTour} />}
        {currentTab === 'calendar' && <ClubCalendarView />}
        {currentTab === 'sessions' && <SessionScheduleList />}
        {currentTab === 'staff' && <StaffListView />}
        {currentTab === 'pools' && <PoolSetupTab />}
        {currentTab === 'targets' && <AnnualTargetsTab />}
      </div>
    </section>
  );
}
