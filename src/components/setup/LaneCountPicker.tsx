import React from 'react';
import { useApp } from '../../context/AppContext';
import { DraftNumberInput } from '../common/DraftNumberInput';

const QUICK_COUNTS = [4, 6, 8, 10];

export function LaneCountPicker() {
  const { config, updateConfig } = useApp();

  const setLaneCount = (val: number) => {
    const count = Math.min(10, Math.max(1, Math.round(val)));
    updateConfig({ laneCount: count });
  };

  return (
    <div className="config-card">
      <div className="config-card-header">
        <span className="config-tag">POOL</span>
        <h2>Active Lanes</h2>
      </div>
      <p className="config-help">Select the number of lanes in use (1 – 10)</p>
      <div className="lane-count-picker" role="radiogroup" aria-label="Number of lanes">
        {QUICK_COUNTS.map(count => (
          <button
            key={count}
            type="button"
            className={`count-pill ${config.laneCount === count ? 'active' : ''}`}
            onClick={() => setLaneCount(count)}
          >
            {count}
          </button>
        ))}
        <div className="custom-lane-stepper">
          <button
            type="button"
            className="stepper-btn"
            aria-label="Decrease lanes"
            onClick={() => setLaneCount(config.laneCount - 1)}
          >
            −
          </button>
          <DraftNumberInput
            id="laneCountInput"
            min={1}
            max={10}
            fallback={6}
            value={config.laneCount}
            onCommit={setLaneCount}
            aria-label="Lane count"
          />
          <button
            type="button"
            className="stepper-btn"
            aria-label="Increase lanes"
            onClick={() => setLaneCount(config.laneCount + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

