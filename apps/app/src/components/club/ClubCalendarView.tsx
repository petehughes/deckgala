import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { StaffOverrideModal } from './StaffOverrideModal';
import { ClubClosureModal } from './ClubClosureModal';
import { WeeklyBriefingModal } from './WeeklyBriefingModal';
import { getISOWeek, calculateTotalDistance, formatSetItem } from '../../lib/weeks';
import type { ScheduledSession, SessionStaffOverride } from '../../types';

export function ClubCalendarView() {
  const { club, loadSessionFromSchedule } = useApp();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overrideModalSession, setOverrideModalSession] = useState<ScheduledSession | null>(null);
  const [overrideModalDate, setOverrideModalDate] = useState<string>('');
  const [existingOverride, setExistingOverride] = useState<SessionStaffOverride | null>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [editingClosureId, setEditingClosureId] = useState<string | null>(null);

  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [weeklyModalSession, setWeeklyModalSession] = useState<ScheduledSession | null>(null);
  const [weeklyModalWeekKey, setWeeklyModalWeekKey] = useState<string>('');

  // Parse selected date
  const currDateObj = new Date(`${selectedDate}T00:00:00`);
  const dayOfWeek = currDateObj.getDay() as ScheduledSession['dayOfWeek']; // 0 = Sun, 1 = Mon...

  // Check if selected date is inside any Club Closure
  const activeClosure = (club.clubClosures || []).find(
    c => selectedDate >= c.startDate && selectedDate <= c.endDate
  );

  // Find sessions for selected date:
  // 1. Weekly sessions that run on this day of week
  // 2. One-off sessions specifically on this date
  const scheduledSessionsForDate = (club.scheduledSessions || []).filter(s => {
    if (s.recurrence === 'weekly') {
      return s.dayOfWeek === dayOfWeek;
    }
    return s.specificDate === selectedDate;
  });

  // Shift date helper
  const shiftDay = (days: number) => {
    const next = new Date(currDateObj);
    next.setDate(next.getDate() + days);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  const handleOpenOverride = (session: ScheduledSession, dateStr: string) => {
    const override = (club.staffOverrides || []).find(
      o => o.scheduledSessionId === session.id && o.date === dateStr
    );
    setOverrideModalSession(session);
    setOverrideModalDate(dateStr);
    setExistingOverride(override || null);
  };

  // Format date display
  const dateFormatted = currDateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="club-calendar-container" aria-label="Club Calendar View">
      {/* Calendar Header Controls */}
      <div className="calendar-top-bar">
        <div className="date-nav-controls">
          <button
            type="button"
            className="btn btn-sm btn-secondary date-nav-btn"
            onClick={() => shiftDay(-1)}
            aria-label="Previous day"
          >
            <Icon name="chevron-left" size={16} />
            <span>Prev Day</span>
          </button>
          <div className="current-date-badge">
            <Icon name="calendar" size={18} />
            <input
              type="date"
              className="calendar-date-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              aria-label="Select date"
            />
            <span className="current-date-text">{dateFormatted}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary date-nav-btn"
            onClick={() => shiftDay(1)}
            aria-label="Next day"
          >
            <span>Next Day</span>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>

        <div className="calendar-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline-coral"
            onClick={() => {
              setEditingClosureId(null);
              setIsClosureModalOpen(true);
            }}
          >
            <Icon name="alert" size={16} />
            <span>+ Add Club Closure / Holiday</span>
          </button>
        </div>
      </div>

      {/* Active Club Closure Banner if closed */}
      {activeClosure && (
        <div className="club-closure-banner" role="alert">
          <div className="closure-banner-icon">
            <Icon name="alert" size={24} />
          </div>
          <div className="closure-banner-content">
            <div className="closure-banner-tag">CLUB FACILITY CLOSED</div>
            <h4 className="closure-banner-title">{activeClosure.title}</h4>
            <p className="closure-banner-dates">
              Closed from {activeClosure.startDate} to {activeClosure.endDate}
              {activeClosure.reason && ` · ${activeClosure.reason}`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setEditingClosureId(activeClosure.id);
              setIsClosureModalOpen(true);
            }}
          >
            <Icon name="edit" size={14} />
            <span>Edit Closure</span>
          </button>
        </div>
      )}

      {/* Sessions for Selected Day */}
      <div className="calendar-day-sessions">
        <div className="calendar-section-title-row">
          <h3>
            Training Sessions Scheduled for {currDateObj.toLocaleDateString('en-GB', { weekday: 'long' })}
          </h3>
          <span className="session-count-tag">
            {scheduledSessionsForDate.length} {scheduledSessionsForDate.length === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        {scheduledSessionsForDate.length === 0 ? (
          <div className="empty-calendar-day">
            <Icon name="calendar" size={36} />
            <h4>No Sessions Scheduled for this Day</h4>
            <p>
              Use the <strong>Session Schedules</strong> tab to schedule regular weekly sessions (e.g. Wednesday 8:00 PM) or one-off galas.
            </p>
          </div>
        ) : (
          <div className="calendar-session-cards-grid">
            {scheduledSessionsForDate.map(session => {
              const pool = (club.pools || []).find(p => p.id === session.poolId) || club.pools[0];
              const defaultCoach = (club.coaches || []).find(c => c.id === session.defaultCoachId);

              // Check if there is an active staffing override for this session on this date!
              const override = (club.staffOverrides || []).find(
                o => o.scheduledSessionId === session.id && o.date === selectedDate
              );
              const coveringCoach = override
                ? (club.coaches || []).find(c => c.id === override.assignedCoachId)
                : null;

              const squads = (club.groups || []).filter(g => session.groupIds.includes(g.id));

              return (
                <div
                  key={session.id}
                  className={`calendar-session-card ${override ? 'has-override' : ''} ${
                    activeClosure ? 'under-closure' : ''
                  }`}
                >
                  <div className="card-top-row">
                    <div className="time-badge">
                      <Icon name="clock" size={14} />
                      <span>
                        {session.startTime} – {session.endTime}
                      </span>
                    </div>
                    <div className="recurrence-tag">
                      {session.recurrence === 'weekly' ? 'Weekly Slot' : 'One-off Event'}
                    </div>
                  </div>

                  <h4 className="calendar-session-title">{session.title}</h4>

                  {/* Facility & Squads */}
                  <div className="calendar-session-specs">
                    {pool && (
                      <span className="spec-item pool">
                        <Icon name="pool" size={14} />
                        <span>
                          {pool.name} ({pool.laneCount}L · {pool.length})
                        </span>
                      </span>
                    )}
                    <div className="squad-chips-wrap">
                      {squads.map(sq => (
                        <span key={sq.id} className="squad-chip-sm">
                          <span className={`group-color-dot dot-${sq.color || 'cyan'}`} />
                          <span>{sq.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Coaching Staff Status */}
                  <div className="coaching-staff-status-box">
                    <div className="staff-header-row">
                      <span className="staff-box-label">COACHING STAFF</span>
                      {override && <span className="override-pill">Staff Cover Active</span>}
                    </div>

                    {override && coveringCoach ? (
                      <div className="staff-cover-details">
                        <div className="cover-name-row">
                          <Icon name="users" size={16} />
                          <span className="covering-name">
                            Covering: <strong>{coveringCoach.name}</strong>
                          </span>
                        </div>
                        <div className="cover-sub-text">
                          {defaultCoach && (
                            <span>
                              Covering for <em>{defaultCoach.name}</em> ·{' '}
                            </span>
                          )}
                          <span className="override-reason">{override.reason}</span>
                          {override.notes && ` (${override.notes})`}
                        </div>
                      </div>
                    ) : (
                      <div className="staff-regular-details">
                        <Icon name="users" size={16} />
                        <span>
                          Default Coach:{' '}
                          <strong>{defaultCoach ? defaultCoach.name : 'Unassigned'}</strong>
                          {defaultCoach?.isHeadCoach && ' (Head Coach)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Head Coach Briefing Box with Weekly Sets */}
                  {(() => {
                    const dateIso = getISOWeek(selectedDate);
                    const weeklyPlan = (session.weeklyPlans || []).find(
                      p => p.weekKey === dateIso.weekKey || p.weekNumber === dateIso.week
                    );
                    const briefingText = weeklyPlan?.briefing || session.headCoachNotes;
                    const focusText = weeklyPlan?.targetFocus || session.targetFocus;
                    const totalVol = weeklyPlan ? calculateTotalDistance(weeklyPlan.setList) : 0;

                    return (
                      <div className={`session-briefing-snippet ${weeklyPlan ? 'has-weekly-plan' : ''}`}>
                        <div className="briefing-mini-header">
                          <span className="briefing-mini-tag">
                            {weeklyPlan
                              ? `WEEK ${weeklyPlan.weekNumber} BRIEFING & SETS`
                              : 'HEAD COACH BRIEFING'}
                          </span>
                          {totalVol > 0 && (
                            <span className="briefing-vol-badge">{totalVol.toLocaleString()}m</span>
                          )}
                          {focusText && (
                            <span className="briefing-focus">Focus: {focusText}</span>
                          )}
                        </div>
                        {briefingText && <p className="briefing-text">{briefingText}</p>}

                        {/* Planned Sets for this date's week */}
                        {weeklyPlan && weeklyPlan.setList && weeklyPlan.setList.length > 0 && (
                          <div className="calendar-sets-list-preview">
                            <span className="sets-preview-label">Sets for Week {weeklyPlan.weekNumber}:</span>
                            <div className="calendar-sets-chips">
                              {weeklyPlan.setList.map((set, sIdx) => (
                                <span key={set.id || sIdx} className="calendar-set-chip">
                                  {formatSetItem(set)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Session Action Buttons */}
                  <div className="calendar-card-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-cyan"
                      onClick={() => {
                        const dateIso = getISOWeek(selectedDate);
                        setWeeklyModalSession(session);
                        setWeeklyModalWeekKey(dateIso.weekKey);
                        setIsWeeklyModalOpen(true);
                      }}
                      title="View and edit weekly briefing and set list"
                    >
                      <Icon name="calendar" size={14} />
                      <span>Weekly Sets & Briefing</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenOverride(session, selectedDate)}
                      title="Assign a cover coach for this specific date"
                    >
                      <Icon name="users" size={14} />
                      <span>{override ? 'Edit Cover Staff' : 'Override / Cover Staff'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => loadSessionFromSchedule(session, selectedDate)}
                      title="Load this session and start live timing"
                    >
                      <Icon name="play" size={14} />
                      <span>Launch This Session</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Club Closures List */}
      <div className="scheduled-closures-section">
        <div className="calendar-section-title-row">
          <h4>Scheduled Club Closures & Holidays ({(club.clubClosures || []).length})</h4>
        </div>
        <div className="closures-list-grid">
          {(club.clubClosures || []).map(closure => (
            <div key={closure.id} className="closure-item-card">
              <div className="closure-card-info">
                <span className="closure-item-title">{closure.title}</span>
                <span className="closure-item-dates">
                  {closure.startDate} → {closure.endDate}
                </span>
                {closure.reason && (
                  <span className="closure-item-reason">{closure.reason}</span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setEditingClosureId(closure.id);
                  setIsClosureModalOpen(true);
                }}
              >
                <Icon name="edit" size={14} />
                <span>Edit</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Override Modal */}
      <StaffOverrideModal
        isOpen={Boolean(overrideModalSession)}
        onClose={() => setOverrideModalSession(null)}
        session={overrideModalSession}
        targetDate={overrideModalDate}
        existingOverride={existingOverride}
      />

      {/* Club Closure Modal */}
      <ClubClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => {
          setIsClosureModalOpen(false);
          setEditingClosureId(null);
        }}
        initialClosureId={editingClosureId}
      />

      {/* Weekly Briefing & Sets Modal */}
      <WeeklyBriefingModal
        isOpen={isWeeklyModalOpen}
        onClose={() => {
          setIsWeeklyModalOpen(false);
          setWeeklyModalSession(null);
        }}
        session={weeklyModalSession}
        initialWeekKey={weeklyModalWeekKey}
      />
    </div>
  );
}

