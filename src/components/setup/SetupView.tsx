import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { PoolSelectorCard } from './PoolSelectorCard';
import { LaneCountPicker } from './LaneCountPicker';
import { SetDetailsCard } from './SetDetailsCard';
import { StopwatchModeSection } from './StopwatchModeSection';
import { SessionSquadsSelector } from './SessionSquadsSelector';
import { LaneAssignments } from './LaneAssignments';

export function SessionView() {
  const { setCurrentView } = useApp();

  return (
    <section className="view-panel active" aria-label="Session View">
      <div className="session-facility-section">
        <PoolSelectorCard />
      </div>

      <div className="setup-top-grid">
        <LaneCountPicker />
        <SetDetailsCard />
      </div>

      <StopwatchModeSection />

      <SessionSquadsSelector />

      <LaneAssignments />

      <div className="setup-footer-cta">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setCurrentView('deck')}
        >
          <span>Launch Pool Deck Timer</span>
          <Icon name="play" size={20} />
        </button>
      </div>
    </section>
  );
}

export const SetupView = SessionView;
