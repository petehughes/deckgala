import React, { useState } from 'react';
import { useApp, useStopwatchState } from '../../context/AppContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { Icon } from '../common/Icon';
import { MasterConsole } from './MasterConsole';
import { RecentSplitsTicker } from './RecentSplitsTicker';
import { DeckLaneCard } from './DeckLaneCard';

export function DeckView() {
  const { config } = useApp();
  const { resetClock, handleReleaseAllLanes } = useStopwatchState();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const activeLanes = config.lanes.slice(0, config.laneCount);

  return (
    <section className="view-panel active" aria-label="Pool Deck Stopwatch View">
      <MasterConsole onRequestReset={() => setResetModalOpen(true)} />

      {config.stopwatchMode === 'manual' && (
        <div className="manual-deck-actions">
          <div className="manual-deck-hint">
            <span className="manual-mode-tag">MANUAL PUSH</span>
            <span>Push-release the next wave across all active lanes simultaneously, or individually per lane below.</span>
          </div>
          <button
            type="button"
            className="btn btn-release-all btn-sm"
            onClick={handleReleaseAllLanes}
          >
            <Icon name="play" size={16} />
            <span>Release All Lanes</span>
          </button>
        </div>
      )}

      <RecentSplitsTicker />

      <div className="deck-lanes-grid">
        {activeLanes.map(laneCfg => (
          <DeckLaneCard key={laneCfg.lane} laneConfig={laneCfg} />
        ))}
      </div>

      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetClock}
        title="Reset Master Clock?"
        message="This will stop the active timer and clear swimmers currently in the water. Recorded splits in the Results tab will be preserved."
        confirmLabel="Reset Clock"
      />
    </section>
  );
}

