import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LaneAssignmentCard } from './LaneAssignmentCard';

export function LaneAssignments() {
  const { config, updateConfig } = useApp();
  const [showTextMode, setShowTextMode] = useState(false);

  const setAllIntervals = (sec: number) => {
    updateConfig(prev => ({
      ...prev,
      lanes: prev.lanes.map(l => ({ ...l, interval: sec }))
    }));
  };

  const activeLanes = config.lanes.slice(0, config.laneCount);

  return (
    <div className="lanes-setup-section">
      <div className="section-title-row">
        <div>
          <h2 className="section-heading">Lane Swimmer Assignments &amp; Intervals</h2>
          <p className="section-sub">
            Select swimmers in wave order for each lane (1st = Wave 1 @ 0s, 2nd = Wave 2 @ +Interval, etc.)
          </p>
        </div>
        <div className="bulk-actions">
          <span className="bulk-label">All lanes interval:</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAllIntervals(5)}
          >
            5s
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAllIntervals(10)}
          >
            10s
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAllIntervals(15)}
          >
            15s
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowTextMode(prev => !prev)}
            title="Toggle between dropdown picker and raw text entry"
          >
            {showTextMode ? 'Hide Text Edit' : 'Text Edit Mode'}
          </button>
        </div>
      </div>

      <div className="lanes-setup-grid">
        {activeLanes.map((laneCfg, idx) => (
          <LaneAssignmentCard
            key={laneCfg.lane}
            laneConfig={laneCfg}
            laneIndex={idx}
            showTextMode={showTextMode}
          />
        ))}
      </div>
    </div>
  );
}

