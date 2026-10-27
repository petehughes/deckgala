import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { WeeklyBriefingModal } from '../club/WeeklyBriefingModal';
import {
  getISOWeek,
  getSurroundingWeeks,
  formatSetItem,
  calculateTotalDistance,
  calculateSetDistance
} from '../../lib/weeks';
import type { ScheduledSession, WeeklySessionPlan, SwimSetItem } from '../../types';

export function HeadCoachBriefingCard() {
  const { config, club, updateConfig, loadSessionFromSchedule, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(config.headCoachNotes || '');
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);

  // 1. Resolve matching scheduled session:
  // by scheduledSessionId, or matching sessionName, or fallback to first session in club
  const scheduledSession = useMemo<ScheduledSession | null>(() => {
    const sessions = club.scheduledSessions || [];
    if (config.scheduledSessionId) {
      const found = sessions.find(s => s.id === config.scheduledSessionId);
      if (found) return found;
    }
    const foundByName = sessions.find(
      s => s.title.toLowerCase() === (config.sessionName || '').toLowerCase()
    );
    if (foundByName) return foundByName;
    return sessions[0] || null;
  }, [club.scheduledSessions, config.scheduledSessionId, config.sessionName]);

  // 2. Current ISO week for the session date
  const sessionDateStr = config.sessionDate || new Date().toISOString().slice(0, 10);
  const dateIso = useMemo(() => getISOWeek(sessionDateStr), [sessionDateStr]);

  // Selected week key state (defaults to dateIso.weekKey or activeWeeklyPlan.weekKey)
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(
    config.activeWeeklyPlan?.weekKey || dateIso.weekKey
  );

  // 3. Resolve active weekly plan:
  // Check if config.activeWeeklyPlan matches selectedWeekKey, or look in scheduledSession.weeklyPlans
  const activePlan = useMemo<WeeklySessionPlan | null>(() => {
    if (config.activeWeeklyPlan && config.activeWeeklyPlan.weekKey === selectedWeekKey) {
      return config.activeWeeklyPlan;
    }
    if (!scheduledSession || !scheduledSession.weeklyPlans) return null;
    return (
      scheduledSession.weeklyPlans.find(
        p => p.weekKey === selectedWeekKey || p.weekNumber === parseInt(selectedWeekKey.split('-W')[1], 10)
      ) ||
      (selectedWeekKey === dateIso.weekKey ? scheduledSession.weeklyPlans[0] : null) ||
      null
    );
  }, [config.activeWeeklyPlan, selectedWeekKey, scheduledSession, dateIso.weekKey]);

  // Surrounding 7 weeks for the week pill carousel
  const surroundingWeeks = useMemo(() => {
    return getSurroundingWeeks(sessionDateStr, 2, 4);
  }, [sessionDateStr]);

  // Find assigned coach and covering coach
  const assignedCoach = (club.coaches || []).find(c => c.id === config.assignedCoachId);
  const coveringCoach = (club.coaches || []).find(c => c.id === config.coveringCoachId);

  // Handle switching to another scheduled session
  const handleSelectSession = (sessionId: string) => {
    const targetSession = (club.scheduledSessions || []).find(s => s.id === sessionId);
    if (targetSession) {
      loadSessionFromSchedule(targetSession, config.sessionDate);
      setSelectedWeekKey(dateIso.weekKey);
    }
  };

  // Handle selecting a different week
  const handleSelectWeek = (weekKey: string) => {
    setSelectedWeekKey(weekKey);
    if (scheduledSession && scheduledSession.weeklyPlans) {
      const plan = scheduledSession.weeklyPlans.find(p => p.weekKey === weekKey);
      if (plan) {
        updateConfig({
          activeWeeklyPlan: plan,
          headCoachNotes: plan.briefing
        });
        showToast(`Loaded Week ${plan.weekNumber} briefing & sets`, 'info');
      }
    }
  };

  const handleSave = () => {
    updateConfig({ headCoachNotes: notes.trim() });
    setIsEditing(false);
  };

  // Handle setting a specific set item as the active set in the timing stopwatch
  const handleActivateSet = (setItem: SwimSetItem) => {
    const formatted = formatSetItem(setItem);
    updateConfig({ setName: formatted });
    showToast(`Set active workout set: ${formatted}`, 'success');
  };

  const setList = activePlan?.setList || [];
  const totalVolume = calculateTotalDistance(setList);

  const displayBriefing =
    (isEditing ? notes : config.headCoachNotes) ||
    activePlan?.briefing ||
    scheduledSession?.headCoachNotes ||
    'No head coach briefing set for this session.';

  const displayFocus = activePlan?.targetFocus || scheduledSession?.targetFocus || '';
  const displayIntensity = activePlan?.expectedIntensity || scheduledSession?.expectedIntensity || 'high';

  return (
    <div className="config-card head-coach-briefing-card" aria-label="Head Coach Briefing & Weekly Sets">
      {/* Card Header */}
      <div className="config-card-header">
        <div className="header-left">
          <div className="briefing-header-tag-row">
            <span className="config-tag briefing">HEAD COACH BRIEFING</span>
            {activePlan && (
              <span className="config-tag week-plan-tag">
                WEEK {activePlan.weekNumber} SCHEDULED
              </span>
            )}
            {totalVolume > 0 && (
              <span className="volume-stat-badge">
                <Icon name="pool" size={14} />
                <span>{totalVolume.toLocaleString()}m total</span>
              </span>
            )}
          </div>
          <h2>
            Session Expectations & Focus
            {displayFocus ? ` · ${displayFocus}` : ''}
          </h2>
        </div>

        <div className="header-right-btns">
          {scheduledSession && (
            <button
              type="button"
              className="btn btn-sm btn-outline-cyan"
              onClick={() => setIsWeeklyModalOpen(true)}
              title="Open full weekly briefing & set list manager"
            >
              <Icon name="calendar" size={14} />
              <span>Plan / Edit Weekly Sets</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setNotes(config.headCoachNotes || displayBriefing);
                setIsEditing(true);
              }
            }}
          >
            <Icon name={isEditing ? 'check' : 'edit'} size={14} />
            <span>{isEditing ? 'Save Briefing' : 'Edit Briefing'}</span>
          </button>
        </div>
      </div>

      <div className="briefing-card-body">
        {/* Scheduled Session Banner & Selector */}
        <div className="session-link-banner">
          <div className="session-select-meta">
            <span className="meta-label">SCHEDULED SESSION:</span>
            <select
              className="session-schedule-picker-select"
              value={scheduledSession?.id || ''}
              onChange={e => handleSelectSession(e.target.value)}
              aria-label="Select Scheduled Session"
            >
              {(club.scheduledSessions || []).map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.recurrence === 'weekly' ? 'Weekly' : 'One-off'} · {s.startTime}-{s.endTime})
                </option>
              ))}
            </select>
          </div>

          {scheduledSession && (
            <span className="session-timing-pill">
              <Icon name="clock" size={14} />
              <span>{scheduledSession.startTime} – {scheduledSession.endTime}</span>
            </span>
          )}
        </div>

        {/* Weekly Carousel Strip */}
        <div className="session-week-switcher-strip" aria-label="Select training week">
          <span className="week-strip-label">TRAINING WEEK:</span>
          <div className="week-strip-scroll">
            {surroundingWeeks.map(w => {
              const isSelected = w.weekKey === selectedWeekKey;
              const hasPlan = (scheduledSession?.weeklyPlans || []).some(p => p.weekKey === w.weekKey);
              const plan = (scheduledSession?.weeklyPlans || []).find(p => p.weekKey === w.weekKey);
              const meters = plan ? calculateTotalDistance(plan.setList) : 0;

              return (
                <button
                  key={w.weekKey}
                  type="button"
                  className={`session-week-pill ${isSelected ? 'active' : ''} ${hasPlan ? 'has-plan' : ''} ${
                    w.isCurrent ? 'is-current' : ''
                  }`}
                  onClick={() => handleSelectWeek(w.weekKey)}
                  title={`${w.label}${hasPlan ? ` (${meters}m planned)` : ''}`}
                >
                  <span className="week-pill-tag">{w.shortLabel}</span>
                  {w.isCurrent && <span className="now-dot">Now</span>}
                  {hasPlan ? (
                    <span className="meters-tag">{meters > 0 ? `${(meters / 1000).toFixed(1)}k` : '✓'}</span>
                  ) : (
                    <span className="no-plan-dash">–</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coaching Allocation & Intensity Banner */}
        <div className="briefing-staff-banner">
          <div className="staff-meta-group">
            <span className="staff-meta-label">LEAD COACH:</span>
            <span className="staff-meta-val">
              {assignedCoach ? (
                <>
                  <span className={`group-color-dot dot-${assignedCoach.color || 'cyan'}`} />
                  <strong>{assignedCoach.name}</strong>
                  {assignedCoach.isHeadCoach && ' (Head Coach)'}
                </>
              ) : (
                'Coach Sarah Jenkins (Head Coach)'
              )}
            </span>
          </div>

          <div className="staff-meta-right">
            <span className={`intensity-badge-pill ${displayIntensity}`}>
              Intensity: {displayIntensity === 'race_pace'
                ? 'Race Pace'
                : displayIntensity === 'high'
                ? 'Threshold'
                : displayIntensity === 'moderate'
                ? 'Aerobic'
                : 'Recovery'}
            </span>

            {coveringCoach && (
              <div className="covering-meta-pill">
                <Icon name="users" size={14} />
                <span>Staff Cover: {coveringCoach.name} covering</span>
              </div>
            )}
          </div>
        </div>

        {/* What is to be expected / Briefing Instructions */}
        {isEditing ? (
          <div className="form-field briefing-edit-field">
            <label htmlFor="briefingNotesTextarea">
              Workout Instructions & Expectations (Head Coach Details)
            </label>
            <textarea
              id="briefingNotesTextarea"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter details on what is expected from swimmers and coaches for this workout..."
              autoFocus
            />
          </div>
        ) : (
          <div className="briefing-content-display">
            <div className="briefing-box-header-sm">
              <span className="briefing-subhead">COACH & WORKOUT INSTRUCTIONS</span>
            </div>
            <p className="briefing-expectation-text">{displayBriefing}</p>

            {/* Complete Weekly Scheduled Set List */}
            <div className="active-weekly-sets-container">
              <div className="weekly-sets-headline">
                <div className="headline-left">
                  <span className="headline-title">
                    🏊 WORKOUT SET LIST · {activePlan ? `WEEK ${activePlan.weekNumber}` : 'SCHEDULED SETS'}
                  </span>
                  {totalVolume > 0 && (
                    <span className="vol-stat">
                      ({totalVolume.toLocaleString()}m · {setList.length} {setList.length === 1 ? 'set' : 'sets'})
                    </span>
                  )}
                </div>
                <span className="tap-set-hint">⚡ Tap any set to activate on timing stopwatch</span>
              </div>

              {setList.length === 0 ? (
                <div className="empty-weekly-sets-banner">
                  <Icon name="clock" size={20} />
                  <span>No swimming sets planned for this week yet.</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-cyan"
                    onClick={() => setIsWeeklyModalOpen(true)}
                  >
                    + Add Sets for Week {activePlan?.weekNumber || dateIso.week}
                  </button>
                </div>
              ) : (
                <div className="weekly-sets-cards-grid">
                  {setList.map((setItem, idx) => {
                    const formatted = formatSetItem(setItem);
                    const isSelected = config.setName === formatted;
                    const setMeters = calculateSetDistance(setItem);

                    return (
                      <div
                        key={setItem.id || idx}
                        className={`session-set-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleActivateSet(setItem)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleActivateSet(setItem);
                          }
                        }}
                        title="Click to load into stopwatch timer"
                        aria-label={`Set ${idx + 1}: ${formatted}`}
                      >
                        <div className="set-card-left">
                          <span className="set-num-badge">{idx + 1}</span>
                          <div className="set-info-col">
                            <div className="set-specs-row">
                              <span className="set-reps-stroke">
                                {setItem.reps} x {setItem.distance}m {setItem.stroke}
                              </span>
                              {setItem.interval && (
                                <span className="set-interval-tag">{setItem.interval}</span>
                              )}
                              {setItem.intensity && (
                                <span className={`set-zone-pill ${setItem.intensity}`}>
                                  {setItem.intensity}
                                </span>
                              )}
                              <span className="set-vol-badge">{setMeters}m</span>
                            </div>

                            {setItem.description && (
                              <div className="set-desc-text">{setItem.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="set-card-right">
                          {isSelected ? (
                            <span className="active-deck-pill">
                              <span className="pulse-dot" />
                              <span>Active on Timing Deck</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary load-set-btn"
                              onClick={e => {
                                e.stopPropagation();
                                handleActivateSet(setItem);
                              }}
                            >
                              <span>Load Set</span>
                              <Icon name="play" size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Briefing & Sets Modal */}
      {scheduledSession && (
        <WeeklyBriefingModal
          isOpen={isWeeklyModalOpen}
          onClose={() => setIsWeeklyModalOpen(false)}
          session={scheduledSession}
          initialWeekKey={selectedWeekKey}
        />
      )}
    </div>
  );
}
