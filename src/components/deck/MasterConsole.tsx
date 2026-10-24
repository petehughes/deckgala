import React from 'react';
import { useApp, useStopwatchState, useElapsedMs } from '../../context/AppContext';
import { formatMs } from '../../lib/format';
import { Icon } from '../common/Icon';

export interface MasterConsoleProps {
  onRequestReset: () => void;
}

export function MasterConsole({ onRequestReset }: MasterConsoleProps) {
  const { config } = useApp();
  const { stopwatch, toggleClock, handleUndo, handleReleaseAllLanes } = useStopwatchState();
  const elapsedMs = useElapsedMs();

  const modeLabels: Record<string, string> = {
    interval: 'Auto Interval Waves',
    manual: 'Manual Wave Push',
    mass: 'Mass Simultaneous Start'
  };

  let startLabel = 'START SET';
  if (stopwatch.isRunning) {
    startLabel = 'PAUSE';
  } else if (elapsedMs > 0) {
    startLabel = 'RESUME';
  }

  return (
    <div className="master-console">
      <div className="master-clock-block">
        <div className="master-meta">
          <span className="master-set-title">
            {config.setName || 'Unlabeled Set'} ({config.poolCourse})
          </span>
          <span className="master-mode-pill">
            {modeLabels[config.stopwatchMode] || 'Interval'}
          </span>
        </div>
        <div className="master-clock-digits" aria-live="off">
          {formatMs(elapsedMs, true)}
        </div>
      </div>

      <div className="master-controls">
        <button
          type="button"
          className={`btn ${stopwatch.isRunning ? 'btn-pause' : 'btn-start'}`}
          onClick={toggleClock}
        >
          <Icon name={stopwatch.isRunning ? 'pause' : 'play'} size={22} />
          <span>{startLabel}</span>
        </button>

        {config.stopwatchMode === 'manual' && (
          <button
            type="button"
            className="btn btn-release-all"
            onClick={handleReleaseAllLanes}
            title="Release next wave across all active lanes"
          >
            <Icon name="play" size={18} />
            <span>Release All Lanes</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          disabled={stopwatch.undoStack.length === 0}
          title="Undo last split stop"
          onClick={handleUndo}
        >
          <Icon name="undo" size={18} />
          <span>Undo</span>
        </button>

        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={onRequestReset}
        >
          <Icon name="reset" size={18} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

