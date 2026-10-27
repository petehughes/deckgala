import React from 'react';
import { useApp, useStopwatchState, useElapsedMs } from '../../context/AppContext';
import { formatMs } from '../../lib/format';
import { getSwimmerNamesForLane } from '../../lib/lanes';
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

  const totalActiveSwimmers = Object.values(stopwatch.lanes).reduce(
    (acc, lane) => acc + (lane?.activeSwimmers?.length || 0),
    0
  );

  let startLabel = 'START SET';
  let startIcon: 'play' | 'pause' | 'stop' = 'play';
  let startBtnClass = 'btn-start';

  if (stopwatch.isRunning) {
    if (totalActiveSwimmers === 0) {
      startLabel = 'STOP';
      startIcon = 'stop';
      startBtnClass = 'btn-stop';
    } else {
      startLabel = 'PAUSE';
      startIcon = 'pause';
      startBtnClass = 'btn-pause';
    }
  } else if (elapsedMs > 0) {
    startLabel = 'RESUME';
    startIcon = 'play';
    startBtnClass = 'btn-start';
  }

  const hasPendingManualWaves = config.stopwatchMode !== 'manual' || config.lanes.slice(0, config.laneCount).some(laneCfg => {
    const names = getSwimmerNamesForLane(laneCfg);
    const laneRt = stopwatch.lanes[laneCfg.lane];
    if (names.length === 0 || !laneRt) return false;
    if (laneRt.nextWaveIndex >= names.length) return false;
    const candidate = names[laneRt.nextWaveIndex];
    const inWater = laneRt.activeSwimmers.some(s => s.name.toLowerCase() === candidate?.toLowerCase());
    return !inWater;
  });

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
          className={`btn ${startBtnClass}`}
          onClick={toggleClock}
        >
          <Icon name={startIcon} size={22} />
          <span>{startLabel}</span>
        </button>

        {config.stopwatchMode === 'manual' && (
          <button
            type="button"
            className="btn btn-release-all"
            disabled={stopwatch.isRunning && !hasPendingManualWaves}
            onClick={handleReleaseAllLanes}
            title={
              stopwatch.isRunning && !hasPendingManualWaves
                ? 'All swimmers have been released'
                : 'Release next wave across all active lanes'
            }
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

