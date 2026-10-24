import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getSwimmerNamesForLane, getAllAssignedLaneNamesSet } from '../../lib/lanes';
import { DraftNumberInput } from '../common/DraftNumberInput';
import type { LaneConfig } from '../../types';

export interface LaneAssignmentCardProps {
  laneConfig: LaneConfig;
  laneIndex: number;
  showTextMode: boolean;
}

export function LaneAssignmentCard({ laneConfig, laneIndex, showTextMode }: LaneAssignmentCardProps) {
  const {
    club,
    config,
    setCurrentView,
    addSwimmerToLane,
    removeSwimmerFromLane,
    moveSwimmerInLane,
    setLaneInterval,
    setLaneSwimmersText
  } = useApp();

  const [customName, setCustomName] = useState('');

  const names = getSwimmerNamesForLane(laneConfig);
  const assignedNamesLower = getAllAssignedLaneNamesSet(config.lanes, config.laneCount);
  const selectedGroups = club.groups.filter(g => config.selectedGroupIds.includes(g.id));
  const intervalDisabled = config.stopwatchMode === 'mass';

  // Lookup swimmer metadata from club
  const swimmerMetaMap = new Map<string, { pb50m: string; pb100m: string; groupName: string }>();
  club.groups.forEach(g => {
    g.swimmers.forEach(s => {
      swimmerMetaMap.set(s.name.toLowerCase(), {
        pb50m: s.pb50m,
        pb100m: s.pb100m,
        groupName: g.name
      });
    });
  });

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addSwimmerToLane(laneIndex, customName);
    setCustomName('');
  };

  return (
    <div className="lane-setup-card">
      <div className="lane-setup-top">
        <div className="lane-badge">
          <span className="lane-badge-num">{laneConfig.lane}</span>
          <span>Lane {laneConfig.lane}</span>
        </div>
        <div
          className="lane-interval-control"
          style={intervalDisabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
        >
          <label htmlFor={`lane-int-${laneConfig.lane}`}>Send-Off</label>
          <DraftNumberInput
            id={`lane-int-${laneConfig.lane}`}
            className="lane-interval-input"
            min={0}
            max={300}
            fallback={5}
            value={laneConfig.interval}
            onCommit={val => setLaneInterval(laneIndex, val)}
          />
          <span>sec</span>
        </div>
      </div>

      {/* Assigned swimmers wave list */}
      <div className="lane-assigned-list">
        {names.length === 0 ? (
          <div className="lane-empty-hint">
            No swimmers assigned — pick from squad below or type a name
          </div>
        ) : (
          names.map((name, idx) => {
            const delaySec = config.stopwatchMode === 'mass' ? 0 : idx * laneConfig.interval;
            const meta = swimmerMetaMap.get(name.toLowerCase());
            return (
              <div key={`${name}-${idx}`} className="lane-swimmer-pill">
                <div className="lane-swimmer-pill-left">
                  <span className="wave-order-badge">W{idx + 1}</span>
                  <div className="lane-swimmer-pill-info">
                    <span className="lane-swimmer-pill-name">{name}</span>
                    <span className="lane-swimmer-pill-sub">
                      +{delaySec}s
                      {meta?.pb100m ? ` · PB ${meta.pb100m}` : ''}
                    </span>
                  </div>
                </div>
                <div className="lane-swimmer-pill-actions">
                  <button
                    type="button"
                    className="pill-action-btn"
                    disabled={idx === 0}
                    title="Move earlier in wave order"
                    onClick={() => moveSwimmerInLane(laneIndex, idx, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="pill-action-btn"
                    disabled={idx === names.length - 1}
                    title="Move later in wave order"
                    onClick={() => moveSwimmerInLane(laneIndex, idx, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="pill-action-btn pill-remove-btn"
                    title="Remove from lane"
                    onClick={() => removeSwimmerFromLane(laneIndex, idx)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Swimmer Picker from Selected Session Squads */}
      <div className="lane-picker-bar">
        {selectedGroups.length > 0 ? (
          <div className="lane-picker-row">
            <select
              className="lane-swimmer-select"
              aria-label={`Select swimmer for Lane ${laneConfig.lane}`}
              value=""
              onChange={e => {
                if (e.target.value) {
                  addSwimmerToLane(laneIndex, e.target.value);
                }
              }}
            >
              <option value="">+ Pick swimmer from session squads...</option>
              {selectedGroups.map(grp => (
                <optgroup key={grp.id} label={`${grp.name} (${grp.swimmers.length})`}>
                  {grp.swimmers.map(sw => {
                    const inThisLane = names.some(
                      n => n.toLowerCase() === sw.name.toLowerCase()
                    );
                    const inOtherLane =
                      !inThisLane && assignedNamesLower.has(sw.name.toLowerCase());
                    const statusSuffix = inThisLane
                      ? ' ✓ (In this lane)'
                      : inOtherLane
                        ? ' • (In another lane)'
                        : '';
                    return (
                      <option
                        key={sw.id}
                        value={sw.name}
                        disabled={inThisLane}
                      >
                        {sw.name}
                        {statusSuffix}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>
        ) : (
          <div className="lane-no-squad-note">
            No session squads selected above.{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => setCurrentView('swimmers')}
            >
              Manage Swimmers
            </button>
          </div>
        )}

        <div className="lane-custom-add-row">
          <input
            type="text"
            className="lane-custom-input"
            placeholder="Or type guest swimmer name + Enter..."
            aria-label={`Guest swimmer for Lane ${laneConfig.lane}`}
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleAddCustom}
          >
            Add
          </button>
        </div>
      </div>

      {/* Optional raw textarea editor */}
      {showTextMode && (
        <div className="lane-raw-editor">
          <label
            className="swimmer-list-label"
            htmlFor={`lane-swimmers-${laneConfig.lane}`}
          >
            <span>Direct Text Edit (1 per line)</span>
            <span>{names.length} swimmer{names.length === 1 ? '' : 's'}</span>
          </label>
          <textarea
            id={`lane-swimmers-${laneConfig.lane}`}
            className="swimmers-textarea"
            placeholder={'Wave 1 Swimmer\nWave 2 Swimmer'}
            value={laneConfig.swimmersText}
            onChange={e => setLaneSwimmersText(laneIndex, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

