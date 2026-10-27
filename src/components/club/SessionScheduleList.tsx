import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SessionScheduleModal } from './SessionScheduleModal';
import { WeeklyBriefingModal } from './WeeklyBriefingModal';
import { getISOWeek, calculateTotalDistance, formatSetItem } from '../../lib/weeks';
import type { ScheduledSession } from '../../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SessionScheduleList() {
  const { club, deleteScheduledSession, loadSessionFromSchedule } = useApp();

  const [filter, setFilter] = useState<'all' | 'weekly' | 'one_off'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [weeklyModalSession, setWeeklyModalSession] = useState<ScheduledSession | null>(null);

  const currentIso = getISOWeek(new Date());

  const sessions = club.scheduledSessions || [];
  const filtered = sessions.filter(s => {
    if (filter === 'weekly') return s.recurrence === 'weekly';
    if (filter === 'one_off') return s.recurrence === 'one_off';
    return true;
  });

  const handleEdit = (id: string) => {
    setEditingSessionId(id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSessionId(null);
    setIsModalOpen(true);
  };

  const handleDelete = (session: ScheduledSession) => {
    if (confirm(`Are you sure you want to delete "${session.title}"?`)) {
      deleteScheduledSession(session.id);
    }
  };

  return (
    <div className="session-schedule-list-container">
      {/* List Header */}
      <div className="schedule-list-header">
        <div className="header-left">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({sessions.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'weekly' ? 'active' : ''}`}
              onClick={() => setFilter('weekly')}
            >
              Weekly ({sessions.filter(s => s.recurrence === 'weekly').length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'one_off' ? 'active' : ''}`}
              onClick={() => setFilter('one_off')}
            >
              One-off ({sessions.filter(s => s.recurrence === 'one_off').length})
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          <Icon name="plus" size={16} />
          <span>+ Create Session Schedule</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="schedule-cards-grid">
        {filtered.map(session => {
          const pool = (club.pools || []).find(p => p.id === session.poolId) || club.pools[0];
          const coach = (club.coaches || []).find(c => c.id === session.defaultCoachId);
          const squads = (club.groups || []).filter(g => session.groupIds.includes(g.id));

          const timingLabel =
            session.recurrence === 'weekly'
              ? `Every ${DAY_NAMES[session.dayOfWeek !== undefined ? session.dayOfWeek : 1]} · ${session.startTime} - ${session.endTime}`
              : `One-off on ${session.specificDate || 'TBD'} · ${session.startTime} - ${session.endTime}`;

          return (
            <div key={session.id} className="schedule-item-card">
              <div className="schedule-card-top">
                <span className="schedule-timing-badge">
                  <Icon name={session.recurrence === 'weekly' ? 'calendar' : 'clock'} size={14} />
                  <span>{timingLabel}</span>
                </span>
                <span className="schedule-intensity-tag">
                  {session.expectedIntensity === 'race_pace'
                    ? 'Race Pace'
                    : session.expectedIntensity === 'high'
                    ? 'Threshold'
                    : session.expectedIntensity === 'moderate'
                    ? 'Aerobic Base'
                    : 'Recovery'}
                </span>
              </div>

              <h3 className="schedule-title">{session.title}</h3>

              <div className="schedule-details-row">
                {pool && (
                  <span className="detail-pill pool-pill">
                    <Icon name="pool" size={14} />
                    <span>
                      {pool.name} ({pool.laneCount} Lanes · {pool.length})
                    </span>
                  </span>
                )}
                {coach && (
                  <span className="detail-pill coach-pill">
                    <Icon name="users" size={14} />
                    <span>
                      Staff: {coach.name} {coach.isHeadCoach ? '(Head Coach)' : ''}
                    </span>
                  </span>
                )}
              </div>

              <div className="schedule-squads-row">
                <span className="squads-label">Squads:</span>
                {squads.map(sq => (
                  <span key={sq.id} className="squad-mini-badge">
                    <span className={`group-color-dot dot-${sq.color || 'cyan'}`} />
                    <span>{sq.name}</span>
                  </span>
                ))}
              </div>

              {/* Head Coach Briefing & Weekly Set List Preview */}
              {(() => {
                const currentWeekPlan = (session.weeklyPlans || []).find(p => p.weekKey === currentIso.weekKey);
                const planToDisplay = currentWeekPlan || (session.weeklyPlans && session.weeklyPlans[0]);
                const totalVol = planToDisplay ? calculateTotalDistance(planToDisplay.setList) : 0;

                return (
                  <div className="schedule-briefing-preview">
                    <div className="briefing-title">
                      <span>
                        {planToDisplay
                          ? `WEEK ${planToDisplay.weekNumber} BRIEFING & SETS`
                          : 'HEAD COACH BRIEFING & EXPECTATIONS'}
                      </span>
                      <div className="briefing-title-right">
                        {totalVol > 0 && (
                          <span className="vol-pill">{totalVol.toLocaleString()}m</span>
                        )}
                        {(planToDisplay?.targetFocus || session.targetFocus) && (
                          <span className="focus-pill">
                            {planToDisplay?.targetFocus || session.targetFocus}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="briefing-notes">
                      {planToDisplay?.briefing || session.headCoachNotes || 'No specific briefing entered yet.'}
                    </p>

                    {/* Preview first 3 sets if available */}
                    {planToDisplay && planToDisplay.setList && planToDisplay.setList.length > 0 && (
                      <div className="schedule-sets-mini-preview">
                        <div className="mini-sets-label">Planned Sets:</div>
                        <div className="mini-sets-chips">
                          {planToDisplay.setList.slice(0, 4).map((s, idx) => (
                            <span key={s.id || idx} className="mini-set-chip">
                              {formatSetItem(s)}
                            </span>
                          ))}
                          {planToDisplay.setList.length > 4 && (
                            <span className="mini-set-more">
                              +{planToDisplay.setList.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="schedule-card-footer">
                <div className="footer-left-btns">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => loadSessionFromSchedule(session)}
                  >
                    <Icon name="play" size={14} />
                    <span>Launch Live Session</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-cyan weekly-sets-btn"
                    onClick={() => {
                      setWeeklyModalSession(session);
                      setIsWeeklyModalOpen(true);
                    }}
                    title="Configure weekly briefings and swimming set lists"
                  >
                    <Icon name="calendar" size={14} />
                    <span>
                      Weekly Sets & Briefings
                      {session.weeklyPlans && session.weeklyPlans.length > 0
                        ? ` (${session.weeklyPlans.length})`
                        : ''}
                    </span>
                  </button>
                </div>
                <div className="footer-right-btns">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(session.id)}
                  >
                    <Icon name="edit" size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost danger"
                    onClick={() => handleDelete(session)}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SessionScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSessionId(null);
        }}
        initialSessionId={editingSessionId}
      />

      <WeeklyBriefingModal
        isOpen={isWeeklyModalOpen}
        onClose={() => {
          setIsWeeklyModalOpen(false);
          setWeeklyModalSession(null);
        }}
        session={weeklyModalSession}
        initialWeekKey={currentIso.weekKey}
      />
    </div>
  );
}

