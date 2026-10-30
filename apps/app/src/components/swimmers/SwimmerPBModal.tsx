import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import {
  STANDARD_STROKES,
  STROKE_DISTANCES,
  parseTimeToMs,
  formatMsToTime,
  evaluateSwimmerTarget,
  getEffectiveSwimmerPBs
} from '../../lib/targets';
import { uid } from '../../lib/ids';
import type { Swimmer, SwimmerPB, SwimStroke, PoolCourse, AnnualTarget } from '../../types';

export interface SwimmerPBModalProps {
  isOpen: boolean;
  onClose: () => void;
  swimmer: Swimmer | null;
}

export function SwimmerPBModal({ isOpen, onClose, swimmer }: SwimmerPBModalProps) {
  const { club, saveSwimmerPBs } = useApp();
  const [activeStroke, setActiveStroke] = useState<SwimStroke>('Freestyle');
  const [pbs, setPbs] = useState<SwimmerPB[]>([]);

  useEffect(() => {
    if (!isOpen || !swimmer) return;
    setPbs(getEffectiveSwimmerPBs(swimmer));
  }, [isOpen, swimmer]);

  const targets = club.annualTargets || [];

  // Map of stroke + distance -> SwimmerPB
  const pbMap = useMemo(() => {
    const map = new Map<string, SwimmerPB>();
    pbs.forEach(pb => {
      map.set(`${pb.stroke}-${pb.distance}`, pb);
    });
    return map;
  }, [pbs]);

  if (!swimmer) return null;

  const currentDistances = STROKE_DISTANCES[activeStroke] || [100, 200];

  const handleUpdatePB = (stroke: SwimStroke, distance: number, updates: Partial<SwimmerPB>) => {
    setPbs(prev => {
      const key = `${stroke}-${distance}`;
      const existing = prev.find(p => p.stroke === stroke && p.distance === distance);
      if (existing) {
        if (!updates.time && updates.time !== undefined) {
          // Cleared time
          return prev.filter(p => !(p.stroke === stroke && p.distance === distance));
        }
        return prev.map(p => {
          if (p.stroke === stroke && p.distance === distance) {
            const nextTime = updates.time !== undefined ? updates.time : p.time;
            const parsedMs = nextTime ? parseTimeToMs(nextTime) : 0;
            return {
              ...p,
              ...updates,
              timeMs: parsedMs || 0
            };
          }
          return p;
        });
      }

      // New PB entry
      if (!updates.time) return prev;
      const parsedMs = parseTimeToMs(updates.time);
      const newPB: SwimmerPB = {
        id: uid('pb'),
        stroke,
        distance,
        course: updates.course || '25m',
        time: updates.time,
        timeMs: parsedMs || 0,
        date: updates.date || new Date().toISOString().slice(0, 10),
        meetName: updates.meetName || ''
      };
      return [...prev, newPB];
    });
  };

  const handleSave = () => {
    saveSwimmerPBs(swimmer.id, pbs);
    onClose();
  };

  // Evaluate swimmer against targets across all events
  const overallTargetEvals = useMemo(() => {
    const mockSwimmer: Swimmer = { ...swimmer, personalBests: pbs };
    return targets
      .map(t => evaluateSwimmerTarget(mockSwimmer, t))
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [swimmer, pbs, targets]);

  const qualifiedCount = overallTargetEvals.filter(e => e.status === 'qualified').length;
  const closeCount = overallTargetEvals.filter(e => e.status === 'close').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Personal Bests & Target Standards: ${swimmer.name}`}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Icon name="check" size={16} />
            <span>Save Personal Bests</span>
          </button>
        </>
      }
    >
      <div className="swimmer-pb-manager">
        {/* Swimmer Overview Header */}
        <div className="pb-swimmer-header">
          <div className="pb-swimmer-meta">
            <span className="swimmer-title">{swimmer.name}</span>
            <span className="swimmer-badge-pill">
              {[swimmer.age ? `${swimmer.age} yrs` : '', swimmer.gender].filter(Boolean).join(' · ') || 'Open'}
            </span>
          </div>
          <div className="pb-qualification-summary">
            <div className="kpi-mini-pill kpi-gold">
              <span className="kpi-icon">🏆</span>
              <span className="kpi-num">{qualifiedCount}</span>
              <span className="kpi-lbl">Qualified</span>
            </div>
            <div className="kpi-mini-pill kpi-amber">
              <span className="kpi-icon">⚡</span>
              <span className="kpi-num">{closeCount}</span>
              <span className="kpi-lbl">Close (&lt;2%)</span>
            </div>
          </div>
        </div>

        {/* Stroke Navigation Tabs */}
        <div className="stroke-tabs-bar" role="tablist" aria-label="Swim Strokes">
          {STANDARD_STROKES.map(stroke => {
            const countForStroke = pbs.filter(p => p.stroke === stroke).length;
            return (
              <button
                key={stroke}
                type="button"
                role="tab"
                aria-selected={activeStroke === stroke}
                className={`stroke-tab-btn ${activeStroke === stroke ? 'active' : ''}`}
                onClick={() => setActiveStroke(stroke)}
              >
                <span>{stroke}</span>
                {countForStroke > 0 && <span className="tab-count-dot">{countForStroke}</span>}
              </button>
            );
          })}
        </div>

        {/* Distance Grid / Rows */}
        <div className="stroke-distances-container">
          <p className="section-instruction">
            Recording official Personal Bests (100m and above). Times are live compared to County, Regional, and National entry standards for {swimmer.name}.
          </p>

          <div className="pb-distance-list">
            {currentDistances.map(dist => {
              const currentPB = pbMap.get(`${activeStroke}-${dist}`);
              const pbTimeStr = currentPB?.time || '';
              const pbCourse = currentPB?.course || 'SCM';

              // Find matching targets for this stroke and distance
              const matchingTargets = targets.filter(
                t => t.stroke === activeStroke && t.distance === dist
              );

              const mockSwimmer: Swimmer = { ...swimmer, personalBests: pbs };
              const evals = matchingTargets
                .map(t => evaluateSwimmerTarget(mockSwimmer, t))
                .filter((e): e is NonNullable<typeof e> => e !== null);

              return (
                <div key={dist} className={`pb-distance-card ${currentPB?.time ? 'has-pb' : ''}`}>
                  <div className="distance-card-main">
                    <div className="distance-badge">
                      <span className="dist-num">{dist}m</span>
                      <span className="dist-stroke">{activeStroke}</span>
                    </div>

                    <div className="pb-input-group">
                      <label htmlFor={`pb-${activeStroke}-${dist}`}>PB Time (MM:SS.hh)</label>
                      <div className="pb-input-row">
                        <input
                          id={`pb-${activeStroke}-${dist}`}
                          type="text"
                          className="input-pb-time"
                          placeholder="e.g. 1:04.50"
                          aria-label={`PB Time for ${dist}m ${activeStroke}`}
                          value={pbTimeStr}
                          onChange={e =>
                            handleUpdatePB(activeStroke, dist, { time: e.target.value })
                          }
                        />
                        <select
                          className="select-pb-course"
                          value={pbCourse}
                          onChange={e =>
                            handleUpdatePB(activeStroke, dist, {
                              course: e.target.value as PoolCourse
                            })
                          }
                          aria-label="Course length"
                        >
                          <option value="25m">25m (Short Course)</option>
                          <option value="50m">50m (Long Course)</option>
                          <option value="25y">25y (Short Course Yards)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pb-meet-group">
                      <label htmlFor={`meet-${activeStroke}-${dist}`}>Meet / Gala (Opt)</label>
                      <input
                        id={`meet-${activeStroke}-${dist}`}
                        type="text"
                        className="input-pb-meet"
                        placeholder="e.g. Autumn Open Meet"
                        value={currentPB?.meetName || ''}
                        onChange={e =>
                          handleUpdatePB(activeStroke, dist, { meetName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Target Standard Comparisons for this event */}
                  <div className="distance-target-matches">
                    <span className="target-eval-title">Target Standard Gap Analysis:</span>
                    {evals.length === 0 ? (
                      <span className="target-none-hint">No target standards defined for {dist}m {activeStroke}</span>
                    ) : (
                      <div className="target-eval-pills">
                        {evals.map(ev => {
                          const levelClass =
                            ev.target.level === 'national'
                              ? 'pill-national'
                              : ev.target.level === 'regional'
                              ? 'pill-regional'
                              : 'pill-county';

                          return (
                            <div
                              key={ev.target.id}
                              className={`target-eval-pill ${levelClass} status-${ev.status}`}
                              title={`Target: ${ev.target.competitionName} (${ev.target.qualifyingTime})`}
                            >
                              <div className="target-pill-top">
                                <span className="target-level-label">
                                  {ev.target.level.toUpperCase()}
                                </span>
                                <span className="target-time-standard">
                                  QT: {ev.target.qualifyingTime}
                                </span>
                              </div>
                              <div className="target-pill-bottom">
                                {ev.status === 'qualified' && (
                                  <span className="eval-status-qualified">
                                    ✓ Qualified ({ev.gapSec ? `${ev.gapSec}s` : 'Beat QT'})
                                  </span>
                                )}
                                {ev.status === 'close' && (
                                  <span className="eval-status-close">
                                    ⚡ Close ({ev.gapSec}s away)
                                  </span>
                                )}
                                {ev.status === 'developing' && (
                                  <span className="eval-status-developing">
                                    +{ev.gapSec}s to QT
                                  </span>
                                )}
                                {ev.status === 'no_time' && (
                                  <span className="eval-status-notime">No PB time set</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
