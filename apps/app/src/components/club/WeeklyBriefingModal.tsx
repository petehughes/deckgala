import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import {
  getISOWeek,
  getSurroundingWeeks,
  formatWeekLabel,
  calculateTotalDistance,
  formatSetItem,
  SET_TEMPLATES,
  parseSetTextLine,
  calculateSetDistance,
  WeekInfo
} from '../../lib/weeks';
import type { ScheduledSession, SwimSetItem, WeeklySessionPlan } from '../../types';

export interface WeeklyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ScheduledSession | null;
  initialWeekKey?: string;
}

const STROKE_OPTIONS = ['Free', 'Back', 'Breast', 'Fly', 'IM', 'Kick', 'Pull', 'Drill', 'Choice'];
const REPS_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 16];
const DISTANCE_OPTIONS = [25, 50, 100, 200, 400, 800];
const INTERVAL_OPTIONS = ['@ 0:45', '@ 1:00', '@ 1:15', '@ 1:30', '@ 1:45', '@ 2:00', '@ 2:30', 'r: 15s', 'r: 30s'];
const INTENSITY_OPTIONS: { value: SwimSetItem['intensity']; label: string }[] = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'aerobic', label: 'Aerobic' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'lactate', label: 'Lactate' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'recovery', label: 'Recovery' }
];

const FOCUS_SUGGESTIONS = [
  'Aerobic Threshold',
  'Turn Speed & Breakouts',
  'Speed & Starts',
  'IM Transitions & Skills',
  'Lactate Tolerance',
  'Taper & Race Pace'
];

export function WeeklyBriefingModal({
  isOpen,
  onClose,
  session,
  initialWeekKey
}: WeeklyBriefingModalProps) {
  const { saveWeeklySessionPlan, deleteWeeklySessionPlan, cloneWeeklySessionPlan, showToast } = useApp();

  // Current ISO week
  const currentIso = useMemo(() => getISOWeek(new Date()), []);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(initialWeekKey || currentIso.weekKey);

  // Form states for the selected week
  const [briefing, setBriefing] = useState('');
  const [targetFocus, setTargetFocus] = useState('');
  const [expectedIntensity, setExpectedIntensity] = useState<ScheduledSession['expectedIntensity']>('high');
  const [setList, setSetList] = useState<SwimSetItem[]>([]);
  const [notes, setNotes] = useState('');

  // Quick set builder states
  const [builderReps, setBuilderReps] = useState(10);
  const [builderDistance, setBuilderDistance] = useState(100);
  const [builderStroke, setBuilderStroke] = useState('Free');
  const [builderInterval, setBuilderInterval] = useState('@ 1:30');
  const [builderIntensity, setBuilderIntensity] = useState<SwimSetItem['intensity']>('threshold');
  const [builderDesc, setBuilderDesc] = useState('');

  // Text paste mode toggle
  const [isTextMode, setIsTextMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Generate 12 surrounding weeks for scrolling
  const surroundingWeeks = useMemo<WeekInfo[]>(() => {
    return getSurroundingWeeks(new Date(), 3, 9);
  }, []);

  // Find the selected week's existing plan (if any)
  const existingPlan = useMemo(() => {
    if (!session || !session.weeklyPlans) return null;
    return session.weeklyPlans.find(p => p.weekKey === selectedWeekKey) || null;
  }, [session, selectedWeekKey]);

  // Find the previous week's plan (for cloning)
  const previousWeekInfo = useMemo(() => {
    const idx = surroundingWeeks.findIndex(w => w.weekKey === selectedWeekKey);
    if (idx > 0) return surroundingWeeks[idx - 1];
    return null;
  }, [surroundingWeeks, selectedWeekKey]);

  const previousWeekPlan = useMemo(() => {
    if (!session || !session.weeklyPlans || !previousWeekInfo) return null;
    return session.weeklyPlans.find(p => p.weekKey === previousWeekInfo.weekKey) || null;
  }, [session, previousWeekInfo]);

  // Sync state whenever selectedWeekKey or session changes
  useEffect(() => {
    if (!isOpen || !session) return;

    if (existingPlan) {
      setBriefing(existingPlan.briefing || '');
      setTargetFocus(existingPlan.targetFocus || '');
      setExpectedIntensity(existingPlan.expectedIntensity || 'high');
      setSetList(existingPlan.setList ? [...existingPlan.setList] : []);
      setNotes(existingPlan.notes || '');
    } else {
      // Default to session's base template
      setBriefing(session.headCoachNotes || '');
      setTargetFocus(session.targetFocus || 'Aerobic Capacity');
      setExpectedIntensity(session.expectedIntensity || 'high');
      setSetList([]);
      setNotes('');
    }
    setIsTextMode(false);
    setPasteText('');
  }, [isOpen, session, selectedWeekKey, existingPlan]);

  // On open, ensure we select the initial week
  useEffect(() => {
    if (isOpen) {
      setSelectedWeekKey(initialWeekKey || currentIso.weekKey);
    }
  }, [isOpen, initialWeekKey, currentIso.weekKey]);

  if (!isOpen || !session) return null;

  const totalMeters = calculateTotalDistance(setList);

  // Quick Action: Clone from Last Week
  const handleCloneFromPreviousWeek = () => {
    if (!previousWeekPlan) {
      showToast('No plan exists for the previous week to clone', 'warning');
      return;
    }
    setBriefing(previousWeekPlan.briefing);
    setTargetFocus(previousWeekPlan.targetFocus || '');
    setExpectedIntensity(previousWeekPlan.expectedIntensity || 'high');
    setNotes(previousWeekPlan.notes || '');
    setSetList(
      previousWeekPlan.setList.map(item => ({
        ...item,
        id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      }))
    );
    showToast(`Cloned briefing & set list from ${previousWeekInfo?.shortLabel || 'last week'}!`, 'success');
  };

  // Quick Action: Add Preset Set
  const handleAddPreset = (template: typeof SET_TEMPLATES[0]) => {
    const newItem: SwimSetItem = {
      ...template.item,
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    setSetList(prev => [...prev, newItem]);
    showToast(`Added ${template.label}`, 'info');
  };

  // Quick Action: Add Custom Set from Builder
  const handleAddCustomSet = () => {
    const newItem: SwimSetItem = {
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reps: builderReps,
      distance: builderDistance,
      stroke: builderStroke,
      interval: builderInterval,
      intensity: builderIntensity,
      description: builderDesc.trim() || undefined
    };
    setSetList(prev => [...prev, newItem]);
    setBuilderDesc('');
    showToast(`Added ${formatSetItem(newItem)}`, 'info');
  };

  // Move item up / down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    setSetList(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Duplicate item
  const handleDuplicateItem = (index: number) => {
    setSetList(prev => {
      const copy = [...prev];
      const orig = copy[index];
      const cloned: SwimSetItem = {
        ...orig,
        id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      };
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    setSetList(prev => prev.filter((_, i) => i !== index));
  };

  // Parse pasted sets
  const handleImportPastedSets = () => {
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length === 0) return;

    const parsed = lines.map(line => parseSetTextLine(line));
    setSetList(prev => [...prev, ...parsed]);
    setIsTextMode(false);
    setPasteText('');
    showToast(`Imported ${parsed.length} sets`, 'success');
  };

  // Save current week
  const handleSaveCurrentWeek = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parts = selectedWeekKey.split('-W');
    const year = parseInt(parts[0], 10) || currentIso.year;
    const weekNumber = parseInt(parts[1], 10) || currentIso.week;

    const ok = saveWeeklySessionPlan(
      session.id,
      {
        weekNumber,
        year,
        weekKey: selectedWeekKey,
        briefing: briefing.trim(),
        targetFocus: targetFocus.trim(),
        expectedIntensity,
        setList,
        notes: notes.trim()
      },
      existingPlan?.id || null
    );

    if (ok) {
      onClose();
    }
  };

  // Delete current week
  const handleDeleteWeek = () => {
    if (!existingPlan) return;
    if (confirm(`Remove planned briefing and sets for ${selectedWeekKey}?`)) {
      deleteWeeklySessionPlan(session.id, selectedWeekKey);
      setSetList([]);
      setBriefing(session.headCoachNotes || '');
    }
  };

  // Shift week by -1 or +1
  const handleShiftWeek = (delta: number) => {
    const idx = surroundingWeeks.findIndex(w => w.weekKey === selectedWeekKey);
    if (idx !== -1) {
      const nextIdx = Math.max(0, Math.min(surroundingWeeks.length - 1, idx + delta));
      setSelectedWeekKey(surroundingWeeks[nextIdx].weekKey);
    }
  };

  const selectedWeekObj = surroundingWeeks.find(w => w.weekKey === selectedWeekKey);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Briefing & Set List"
      size="lg"
      footer={
        <div className="weekly-modal-footer">
          <div className="footer-left-actions">
            {existingPlan && (
              <button
                type="button"
                className="btn btn-ghost danger btn-sm"
                onClick={handleDeleteWeek}
              >
                <Icon name="trash" size={14} />
                <span>Delete This Week's Plan</span>
              </button>
            )}
          </div>
          <div className="footer-right-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveCurrentWeek}
            >
              <Icon name="check" size={16} />
              <span>Save Week {selectedWeekObj?.week || ''} Plan</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="weekly-briefing-modal-body">
        {/* Session Meta Header */}
        <div className="session-briefing-meta-bar">
          <div className="meta-left">
            <span className="session-meta-pill">
              <Icon name="calendar" size={14} />
              <span>{session.title}</span>
            </span>
            <span className="session-timing-sub">
              {session.recurrence === 'weekly'
                ? `Runs weekly · ${session.startTime} - ${session.endTime}`
                : `One-off session · ${session.startTime} - ${session.endTime}`}
            </span>
          </div>
          <div className="meta-right">
            <span className="volume-stat-badge">
              <Icon name="pool" size={16} />
              <strong>{totalMeters.toLocaleString()}m</strong>
              <span className="stat-sub">({setList.length} sets)</span>
            </span>
          </div>
        </div>

        {/* Horizontal Week Scroller & Quick Week Selectors */}
        <div className="week-scroller-container" aria-label="Week selector">
          <div className="week-scroller-top-row">
            <div className="scroller-nav-btns">
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => handleShiftWeek(-1)}
                title="Previous Week"
              >
                ◀ Prev Week
              </button>
              <button
                type="button"
                className="btn btn-xs btn-outline-cyan"
                onClick={() => setSelectedWeekKey(currentIso.weekKey)}
              >
                Jump to Current ({currentIso.weekKey})
              </button>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => handleShiftWeek(1)}
                title="Next Week"
              >
                Next Week ▶
              </button>
            </div>
            <div className="current-selected-week-label">
              <strong>{selectedWeekObj?.label || selectedWeekKey}</strong>
            </div>
          </div>

          <div className="week-pill-strip" role="tablist">
            {surroundingWeeks.map(w => {
              const isSelected = w.weekKey === selectedWeekKey;
              const hasPlan = (session.weeklyPlans || []).some(p => p.weekKey === w.weekKey);
              const plan = (session.weeklyPlans || []).find(p => p.weekKey === w.weekKey);
              const planMeters = plan ? calculateTotalDistance(plan.setList) : 0;

              return (
                <button
                  key={w.weekKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`week-selector-pill ${isSelected ? 'active' : ''} ${hasPlan ? 'has-plan' : ''} ${
                    w.isCurrent ? 'is-current' : ''
                  }`}
                  onClick={() => setSelectedWeekKey(w.weekKey)}
                >
                  <span className="week-pill-num">{w.shortLabel}</span>
                  {w.isCurrent && <span className="current-badge-dot" title="Current Week">Now</span>}
                  {hasPlan ? (
                    <span className="week-plan-badge">
                      <span className="plan-dot" />
                      {planMeters > 0 ? `${(planMeters / 1000).toFixed(1)}k` : 'Plan'}
                    </span>
                  ) : (
                    <span className="empty-plan-dash">–</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clone & Speed Action Bar */}
        <div className="week-quick-actions-bar">
          <div className="actions-bar-left">
            <button
              type="button"
              className="btn btn-sm btn-outline-cyan clone-last-week-btn"
              onClick={handleCloneFromPreviousWeek}
              disabled={!previousWeekPlan}
              title={previousWeekPlan ? `Copy sets from ${previousWeekInfo?.shortLabel}` : 'No previous week found'}
            >
              <Icon name="copy" size={14} />
              <span>
                📋 Clone from Last Week {previousWeekInfo ? `(${previousWeekInfo.shortLabel})` : ''}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setBriefing(session.headCoachNotes || '');
                setTargetFocus(session.targetFocus || 'Aerobic Capacity');
                setExpectedIntensity(session.expectedIntensity || 'high');
                setSetList([]);
                showToast('Reset to default session template', 'info');
              }}
              title="Reset to default briefing template"
            >
              <Icon name="refresh" size={14} />
              <span>Reset to Base</span>
            </button>
          </div>

          <div className="actions-bar-right">
            <button
              type="button"
              className={`btn btn-sm ${isTextMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsTextMode(!isTextMode)}
            >
              <Icon name="edit" size={14} />
              <span>{isTextMode ? 'Close Paste Mode' : 'Bulk Paste Sets'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: Head Coach Briefing & Expectations */}
        <div className="briefing-form-section">
          <div className="section-title-wrap">
            <span className="section-tag">HEAD COACH BRIEFING</span>
            <h4>Week {selectedWeekObj?.week} Objectives & Expectations</h4>
          </div>

          <div className="form-row">
            <div className="form-field flex-2">
              <label htmlFor="weekFocusInput">Target Focus Area</label>
              <input
                type="text"
                id="weekFocusInput"
                placeholder="e.g. Aerobic Threshold, Breakout Speed, IM Transitions"
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

            <div className="form-field flex-1">
              <label>Expected Intensity</label>
              <div className="intensity-pills" role="radiogroup" aria-label="Workout intensity">
                {(['low', 'moderate', 'high', 'race_pace'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`intensity-pill ${level} ${expectedIntensity === level ? 'active' : ''}`}
                    onClick={() => setExpectedIntensity(level)}
                  >
                    {level === 'low'
                      ? 'Recovery'
                      : level === 'moderate'
                      ? 'Aerobic'
                      : level === 'high'
                      ? 'Threshold'
                      : 'Race Pace'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="weekBriefingNotes">Coach & Swimmer Briefing Instructions *</label>
            <textarea
              id="weekBriefingNotes"
              rows={3}
              placeholder="What should coaches emphasize on deck and what are the specific targets for this week?"
              value={briefing}
              onChange={e => setBriefing(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Text Import / Paste Drawer */}
        {isTextMode && (
          <div className="bulk-paste-drawer">
            <h5>Bulk Paste Workout Sets</h5>
            <p className="bulk-paste-hint">
              Enter one set per line, e.g. <code>10 x 100 Free @ 1:30</code> or <code>8 x 50 Kick @ 1:15</code>
            </p>
            <textarea
              rows={5}
              placeholder={`400 Choice Warmup\n8 x 50 Kick @ 1:15\n10 x 100 Free @ 1:30\n200 Choice Cool-down`}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            />
            <div className="paste-drawer-actions">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleImportPastedSets}
                disabled={!pasteText.trim()}
              >
                <Icon name="check" size={14} />
                <span>Parse & Add Sets</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsTextMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Set List Builder & Touch Buttons */}
        <div className="set-list-section">
          <div className="section-title-wrap">
            <span className="section-tag workout">WORKOUT SET LIST</span>
            <h4>Week {selectedWeekObj?.week} Swimming Sets</h4>
            <span className="volume-pill">
              Volume: <strong>{totalMeters.toLocaleString()}m</strong>
            </span>
          </div>

          {/* Quick-Add One-Tap Preset Chips */}
          <div className="quick-set-presets-wrap">
            <div className="presets-label">⚡ QUICK ADD PRESETS:</div>
            <div className="presets-scroll-row">
              {SET_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  className="preset-set-touch-chip"
                  onClick={() => handleAddPreset(tpl)}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fast Mobile Touch Builder Dial */}
          <div className="touch-builder-dial">
            <div className="builder-header">
              <span className="builder-title">🏊 FAST TOUCH SET BUILDER</span>
              <span className="builder-preview">
                Preview: <strong>{builderReps} x {builderDistance}m {builderStroke} {builderInterval}</strong>
              </span>
            </div>

            {/* Reps Row */}
            <div className="dial-row">
              <span className="dial-label">Reps:</span>
              <div className="dial-chips">
                {REPS_OPTIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`dial-chip ${builderReps === r ? 'active' : ''}`}
                    onClick={() => setBuilderReps(r)}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Row */}
            <div className="dial-row">
              <span className="dial-label">Distance:</span>
              <div className="dial-chips">
                {DISTANCE_OPTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`dial-chip ${builderDistance === d ? 'active' : ''}`}
                    onClick={() => setBuilderDistance(d)}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Row */}
            <div className="dial-row">
              <span className="dial-label">Stroke:</span>
              <div className="dial-chips">
                {STROKE_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`dial-chip ${builderStroke === s ? 'active' : ''}`}
                    onClick={() => setBuilderStroke(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval & Intensity Row */}
            <div className="dial-row">
              <span className="dial-label">Interval:</span>
              <div className="dial-chips">
                {INTERVAL_OPTIONS.map(iv => (
                  <button
                    key={iv}
                    type="button"
                    className={`dial-chip ${builderInterval === iv ? 'active' : ''}`}
                    onClick={() => setBuilderInterval(iv)}
                  >
                    {iv}
                  </button>
                ))}
              </div>
            </div>

            <div className="dial-row">
              <span className="dial-label">Zone:</span>
              <div className="dial-chips">
                {INTENSITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`dial-chip zone ${opt.value} ${builderIntensity === opt.value ? 'active' : ''}`}
                    onClick={() => setBuilderIntensity(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description & Add button */}
            <div className="dial-action-row">
              <input
                type="text"
                placeholder="Optional notes: e.g. descending 1-4, fast turn push-offs..."
                value={builderDesc}
                onChange={e => setBuilderDesc(e.target.value)}
                className="dial-notes-input"
              />
              <button
                type="button"
                className="btn btn-primary add-set-btn"
                onClick={handleAddCustomSet}
              >
                <Icon name="plus" size={16} />
                <span>+ Add Set to Workout</span>
              </button>
            </div>
          </div>

          {/* Current Sets List */}
          <div className="workout-sets-card-list">
            <div className="sets-list-header">
              <span className="sets-count">
                CURRENT WORKOUT ({setList.length} {setList.length === 1 ? 'set' : 'sets'})
              </span>
              {setList.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost danger btn-xs"
                  onClick={() => {
                    if (confirm('Clear all sets for this week?')) setSetList([]);
                  }}
                >
                  Clear All Sets
                </button>
              )}
            </div>

            {setList.length === 0 ? (
              <div className="empty-sets-notice">
                <Icon name="clock" size={28} />
                <p>No sets added for this week yet.</p>
                <p className="sub-hint">
                  Tap any <strong>Quick Add Preset</strong> above, use the <strong>Fast Touch Builder</strong>, or click <strong>Clone from Last Week</strong>!
                </p>
              </div>
            ) : (
              <div className="set-items-grid">
                {setList.map((item, index) => {
                  const setMeters = calculateSetDistance(item);
                  return (
                    <div key={item.id} className="set-item-card">
                      <div className="set-item-number">{index + 1}</div>

                      <div className="set-item-main">
                        <div className="set-item-title-row">
                          <span className="set-item-reps-dist">
                            {item.reps} x {item.distance}m {item.stroke}
                          </span>
                          {item.interval && <span className="set-item-interval">{item.interval}</span>}
                          {item.intensity && (
                            <span className={`set-intensity-badge ${item.intensity}`}>
                              {item.intensity}
                            </span>
                          )}
                          <span className="set-distance-badge">{setMeters}m</span>
                        </div>

                        {item.description && (
                          <div className="set-item-desc">{item.description}</div>
                        )}
                      </div>

                      {/* Touch action buttons */}
                      <div className="set-item-actions">
                        <button
                          type="button"
                          className="btn-touch-action"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          aria-label="Move set up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="btn-touch-action"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === setList.length - 1}
                          title="Move Down"
                          aria-label="Move set down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="btn-touch-action duplicate"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate Set"
                          aria-label="Duplicate set"
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="btn-touch-action delete danger"
                          onClick={() => handleDeleteItem(index)}
                          title="Remove Set"
                          aria-label="Delete set"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
