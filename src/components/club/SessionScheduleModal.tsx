import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { CoachSelector } from '../common/CoachSelector';
import type { DayOfWeek, ScheduledSession, SessionRecurrence } from '../../types';

export interface SessionScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSessionId?: string | null;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' }
];

const FOCUS_SUGGESTIONS = [
  'Aerobic Threshold',
  'Speed & Starts',
  'Turn Speed & Breakouts',
  'Kick Technique & Power',
  'IM Transitions'
];

const BRIEFING_TEMPLATES = [
  {
    label: '+ Distance Set',
    text: 'Aerobic threshold set: 10x100m Free holding steady aerobic pace with 15s rest. Focus on long distance-per-stroke and tight streamlines off every turn.'
  },
  {
    label: '+ Sprint & Starts',
    text: 'Speed development & race prep: 8x50m max sprint from dive blocks, dolphin kick past 10m mark. Full active recovery between efforts.'
  },
  {
    label: '+ Technique & Turns',
    text: 'Technique & Turn mechanics: focus on rapid tucks on flip turns and clean push-offs at depth. Equipment: paddles and pull buoy.'
  }
];

function formatDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes <= 0) return '';
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m duration`;
  if (hrs > 0) return `${hrs} hr duration`;
  return `${mins} min duration`;
}

type WizardStep = 1 | 2 | 3;

export function SessionScheduleModal({
  isOpen,
  onClose,
  initialSessionId = null
}: SessionScheduleModalProps) {
  const { club, saveScheduledSession } = useApp();

  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<SessionRecurrence>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(3); // Wed default
  const [specificDate, setSpecificDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('21:30');
  const [poolId, setPoolId] = useState(club.pools[0]?.id || 'pool-main-25m');
  const [groupIds, setGroupIds] = useState<string[]>([club.groups[0]?.id || 'grp-senior-perf']);
  const [defaultCoachId, setDefaultCoachId] = useState<string>(club.coaches[0]?.id || 'coach-sarah');
  const [headCoachNotes, setHeadCoachNotes] = useState('');
  const [targetFocus, setTargetFocus] = useState('Aerobic Capacity & Turns');
  const [expectedIntensity, setExpectedIntensity] = useState<ScheduledSession['expectedIntensity']>('high');
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTitleError(false);
      if (initialSessionId) {
        const found = (club.scheduledSessions || []).find(s => s.id === initialSessionId);
        if (found) {
          setTitle(found.title);
          setRecurrence(found.recurrence);
          setDayOfWeek(found.dayOfWeek !== undefined ? found.dayOfWeek : 1);
          setSpecificDate(found.specificDate || new Date().toISOString().slice(0, 10));
          setStartTime(found.startTime);
          setEndTime(found.endTime);
          setPoolId(found.poolId);
          setGroupIds(found.groupIds);
          setDefaultCoachId(found.defaultCoachId || club.coaches[0]?.id || '');
          setHeadCoachNotes(found.headCoachNotes || '');
          setTargetFocus(found.targetFocus || '');
          setExpectedIntensity(found.expectedIntensity || 'high');
          return;
        }
      }
      // Defaults for new schedule creation
      setTitle('');
      setRecurrence('weekly');
      setDayOfWeek(3); // Wednesday 8pm example
      setSpecificDate(new Date().toISOString().slice(0, 10));
      setStartTime('20:00');
      setEndTime('21:30');
      setPoolId(club.pools[0]?.id || 'pool-main-25m');
      setGroupIds(club.groups.slice(0, 2).map(g => g.id));
      setDefaultCoachId(club.coaches[0]?.id || 'coach-sarah');
      setHeadCoachNotes('');
      setTargetFocus('Aerobic Capacity & Turns');
      setExpectedIntensity('high');
    }
  }, [isOpen, initialSessionId, club.scheduledSessions, club.pools, club.coaches, club.groups]);

  const toggleGroup = (id: string) => {
    setGroupIds(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));
  };

  const handleSelectAllSquads = () => {
    setGroupIds(club.groups.map(g => g.id));
  };

  const handleClearAllSquads = () => {
    setGroupIds([]);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        setTitleError(true);
        const el = document.getElementById('scheduleTitleInput');
        if (el) el.focus();
        return;
      }
      setTitleError(false);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStep(1);
      setTitleError(true);
      const el = document.getElementById('scheduleTitleInput');
      if (el) el.focus();
      return;
    }

    const found = initialSessionId
      ? (club.scheduledSessions || []).find(s => s.id === initialSessionId)
      : null;

    const ok = saveScheduledSession(
      {
        title: title.trim(),
        recurrence,
        dayOfWeek: recurrence === 'weekly' ? dayOfWeek : undefined,
        specificDate: recurrence === 'one_off' ? specificDate : undefined,
        startTime,
        endTime,
        poolId,
        groupIds,
        defaultCoachId: defaultCoachId || undefined,
        headCoachNotes: headCoachNotes.trim(),
        targetFocus: targetFocus.trim(),
        expectedIntensity,
        weeklyPlans: found?.weeklyPlans
      },
      initialSessionId
    );

    if (ok) {
      onClose();
    }
  };

  const durationText = formatDuration(startTime, endTime);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSessionId ? 'Edit Session Schedule' : 'Create Session Schedule'}
      size="lg"
      footer={
        <div className="wizard-footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="wizard-footer-right">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep((prev) => (prev - 1) as WizardStep)}
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <>
                <button
                  type="submit"
                  form="session-schedule-form"
                  className="btn btn-ghost"
                  title="Save now with current settings"
                >
                  <Icon name="check" size={16} />
                  <span>Quick Save</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                >
                  <span>{step === 1 ? 'Next: Pool & Squads →' : 'Next: Coach Briefing →'}</span>
                </button>
              </>
            ) : (
              <button type="submit" form="session-schedule-form" className="btn btn-primary">
                <Icon name="check" size={16} />
                <span>{initialSessionId ? 'Save Session Schedule' : 'Create Session Schedule'}</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <form id="session-schedule-form" className="modal-form" onSubmit={handleSubmit}>
        {/* Stepper Tabs Bar */}
        <div className="modal-stepper" role="tablist" aria-label="Creation steps">
          <button
            type="button"
            role="tab"
            aria-selected={step === 1}
            className={`modal-step-tab ${step === 1 ? 'active' : ''} ${title.trim() ? 'completed' : ''}`}
            onClick={() => setStep(1)}
          >
            <span className="modal-step-number">{title.trim() && step !== 1 ? '✓' : '1'}</span>
            <span>Timing & Title</span>
          </button>

          <div className="modal-step-separator" />

          <button
            type="button"
            role="tab"
            aria-selected={step === 2}
            className={`modal-step-tab ${step === 2 ? 'active' : ''} ${groupIds.length > 0 ? 'completed' : ''}`}
            onClick={() => {
              if (!title.trim()) {
                setTitleError(true);
                setStep(1);
              } else {
                setStep(2);
              }
            }}
          >
            <span className="modal-step-number">{groupIds.length > 0 && step > 2 ? '✓' : '2'}</span>
            <span>Pool & Squads</span>
          </button>

          <div className="modal-step-separator" />

          <button
            type="button"
            role="tab"
            aria-selected={step === 3}
            className={`modal-step-tab ${step === 3 ? 'active' : ''} ${headCoachNotes.trim() ? 'completed' : ''}`}
            onClick={() => {
              if (!title.trim()) {
                setTitleError(true);
                setStep(1);
              } else {
                setStep(3);
              }
            }}
          >
            <span className="modal-step-number">3</span>
            <span>Coach Briefing</span>
          </button>
        </div>

        {/* STEP 1: Timing & Recurrence */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 1 ? 'flex' : 'none' }}
        >
          <div className="form-field">
            <label htmlFor="scheduleTitleInput">
              Session Title *
              {titleError && <span style={{ color: 'var(--color-crimson, #FF3366)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>Please enter a session title</span>}
            </label>
            <input
              type="text"
              id="scheduleTitleInput"
              placeholder="e.g. Wednesday Evening Performance Aerobic"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError(false);
              }}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Schedule Recurrence</label>
            <div className="recurrence-toggle-group" role="radiogroup" aria-label="Recurrence">
              <button
                type="button"
                className={`recurrence-btn ${recurrence === 'weekly' ? 'active' : ''}`}
                onClick={() => setRecurrence('weekly')}
              >
                <Icon name="calendar" size={18} />
                <div className="rec-text">
                  <span className="rec-title">Weekly Recurring</span>
                  <span className="rec-sub">Regular slot (e.g. Wed 8:00 PM)</span>
                </div>
              </button>
              <button
                type="button"
                className={`recurrence-btn ${recurrence === 'one_off' ? 'active' : ''}`}
                onClick={() => setRecurrence('one_off')}
              >
                <Icon name="clock" size={18} />
                <div className="rec-text">
                  <span className="rec-title">One-off Event</span>
                  <span className="rec-sub">Single date or special gala</span>
                </div>
              </button>
            </div>
          </div>

          {recurrence === 'weekly' ? (
            <div className="form-field">
              <label>Day of the Week</label>
              <div className="day-pills-row" role="radiogroup" aria-label="Day of week">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`day-pill ${dayOfWeek === day.value ? 'active' : ''}`}
                    onClick={() => setDayOfWeek(day.value)}
                  >
                    <span className="day-short">{day.short}</span>
                    <span className="day-full">{day.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="specificDateInput">Event Date</label>
              <input
                type="date"
                id="specificDateInput"
                value={specificDate}
                onChange={e => setSpecificDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="scheduleStartTime">Start Time</label>
              <input
                type="time"
                id="scheduleStartTime"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="scheduleEndTime">End Time</label>
              <input
                type="time"
                id="scheduleEndTime"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {durationText && (
            <div className="time-duration-badge">
              <Icon name="clock" size={14} />
              <span>{durationText}</span>
            </div>
          )}
        </div>

        {/* STEP 2: Pool Facility & Staffing / Squads */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 2 ? 'flex' : 'none' }}
        >
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="schedulePoolSelect">Swimming Pool Facility</label>
              <select
                id="schedulePoolSelect"
                value={poolId}
                onChange={e => setPoolId(e.target.value)}
                required
              >
                {(club.pools || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.laneCount} Lanes · {p.length})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
            <CoachSelector
              id="scheduleCoachSelect"
              label="Default Staff / Coach"
              multiple={false}
              valueKey="id"
              value={defaultCoachId}
              allowUnassigned={true}
              unassignedLabel="No default assigned"
              onChange={val => setDefaultCoachId(typeof val === 'string' ? val : val[0] || '')}
            />
          </div>
          </div>

          <div className="form-field">
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ margin: 0 }}>Participating Squads ({groupIds.length} selected)</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleSelectAllSquads}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleClearAllSquads}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="schedule-squads-picker">
              {club.groups.map(grp => {
                const isChecked = groupIds.includes(grp.id);
                return (
                  <button
                    key={grp.id}
                    type="button"
                    className={`squad-select-pill ${isChecked ? 'active' : ''}`}
                    onClick={() => toggleGroup(grp.id)}
                  >
                    <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                    <span>{grp.name}</span>
                    <span className="squad-count">({grp.swimmers.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 3: Head Coach Briefing & Expectations */}
        <div
          className="wizard-step-panel"
          style={{ display: step === 3 ? 'flex' : 'none' }}
        >
          <div className="head-coach-briefing-box">
            <div className="briefing-box-header">
              <div className="briefing-tag">HEAD COACH BRIEFING</div>
              <h4>Workout Expectations & Objective</h4>
            </div>

            <div className="form-field">
              <label htmlFor="scheduleFocusInput">Target Focus Area</label>
              <input
                type="text"
                id="scheduleFocusInput"
                placeholder="e.g. Aerobic Threshold, Turn Speed, Underwater Kicking"
                value={targetFocus}
                onChange={e => setTargetFocus(e.target.value)}
              />
              <div className="briefing-quick-chips">
                {FOCUS_SUGGESTIONS.map(f => (
                  <button
                    key={f}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => setTargetFocus(f)}
                  >
                    + {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label>Expected Workout Intensity</label>
              <div className="intensity-pills" role="radiogroup" aria-label="Workout intensity">
                {(['low', 'moderate', 'high', 'race_pace'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`intensity-pill ${level} ${expectedIntensity === level ? 'active' : ''}`}
                    onClick={() => setExpectedIntensity(level)}
                  >
                    {level === 'low'
                      ? 'Recovery / Low'
                      : level === 'moderate'
                      ? 'Aerobic Base'
                      : level === 'high'
                      ? 'Threshold / High'
                      : 'Race Pace / Max'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="scheduleNotesInput" style={{ margin: 0 }}>Details on What is to be Expected *</label>
              </div>
              <div className="briefing-quick-chips" style={{ marginBottom: '0.4rem' }}>
                {BRIEFING_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => setHeadCoachNotes(tpl.text)}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
              <textarea
                id="scheduleNotesInput"
                rows={4}
                placeholder="Detail what swimmers & coaches should focus on (e.g. 10x100m Free holding under 1:15, tight tucks on turns, dolphin kicks to 15m. Equipment: paddles and pull buoy)."
                value={headCoachNotes}
                onChange={e => setHeadCoachNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
