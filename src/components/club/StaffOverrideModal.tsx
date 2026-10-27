import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { CoachSelector } from '../common/CoachSelector';
import type { ScheduledSession, SessionStaffOverride } from '../../types';

export interface StaffOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: ScheduledSession | null;
  targetDate?: string;
  existingOverride?: SessionStaffOverride | null;
}

const REASONS = [
  'Holiday / Annual Leave',
  'Illness / Sick Leave',
  'Competition / Meet Duty',
  'Coach Training & CPD',
  'Personal Emergency',
  'Squad Combined Session'
];

export function StaffOverrideModal({
  isOpen,
  onClose,
  session = null,
  targetDate,
  existingOverride = null
}: StaffOverrideModalProps) {
  const { club, saveStaffOverride, deleteStaffOverride } = useApp();

  const [sessionId, setSessionId] = useState(session?.id || club.scheduledSessions[0]?.id || '');
  const [date, setDate] = useState(targetDate || new Date().toISOString().slice(0, 10));
  const [assignedCoachId, setAssignedCoachId] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState('');

  const currentSession = (club.scheduledSessions || []).find(s => s.id === sessionId) || session;
  const originalCoach = (club.coaches || []).find(c => c.id === currentSession?.defaultCoachId);

  useEffect(() => {
    if (isOpen) {
      if (existingOverride) {
        setSessionId(existingOverride.scheduledSessionId);
        setDate(existingOverride.date);
        setAssignedCoachId(existingOverride.assignedCoachId);
        setReason(existingOverride.reason || REASONS[0]);
        setNotes(existingOverride.notes || '');
        return;
      }
      if (session) {
        setSessionId(session.id);
      } else if (club.scheduledSessions.length > 0) {
        setSessionId(club.scheduledSessions[0].id);
      }
      setDate(targetDate || new Date().toISOString().slice(0, 10));
      // Pick a different coach from the default as the initial cover coach
      const defaultCoach = (club.coaches || []).find(c => c.id === session?.defaultCoachId);
      const otherCoaches = (club.coaches || []).filter(c => c.id !== defaultCoach?.id);
      setAssignedCoachId(otherCoaches[0]?.id || club.coaches[0]?.id || '');
      setReason(REASONS[0]);
      setNotes('');
    }
  }, [isOpen, session, targetDate, existingOverride, club.scheduledSessions, club.coaches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !date || !assignedCoachId) return;

    const ok = saveStaffOverride(
      {
        scheduledSessionId: sessionId,
        date,
        assignedCoachId,
        originalCoachId: currentSession?.defaultCoachId,
        reason,
        notes: notes.trim()
      },
      existingOverride?.id
    );

    if (ok) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (existingOverride) {
      deleteStaffOverride(existingOverride.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingOverride ? 'Edit Staffing Override' : 'Assign Session Cover / Staffing Override'}
      size="md"
      footer={
        <>
          {existingOverride && (
            <button
              type="button"
              className="btn btn-outline-danger"
              style={{ marginRight: 'auto' }}
              onClick={handleDelete}
            >
              <Icon name="trash" size={14} />
              <span>Remove Override</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="staff-override-form" className="btn btn-primary">
            <Icon name="check" size={16} />
            <span>{existingOverride ? 'Update Override' : 'Save Staff Cover'}</span>
          </button>
        </>
      }
    >
      <form id="staff-override-form" className="modal-form" onSubmit={handleSubmit}>
        <p className="modal-desc">
          Override the regular coaching assignment for a specific session instance (e.g. Coach Sarah is on holiday on this date so Coach Marcus will cover).
        </p>

        {/* Session Selection */}
        <div className="form-field">
          <label htmlFor="overrideSessionSelect">Training Session</label>
          <select
            id="overrideSessionSelect"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            disabled={Boolean(session && !existingOverride)}
            required
          >
            {(club.scheduledSessions || []).map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>

        {/* Date of Instance */}
        <div className="form-field">
          <label htmlFor="overrideDateInput">Session Instance Date *</label>
          <input
            type="date"
            id="overrideDateInput"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        {/* Regular Coach Info */}
        {originalCoach && (
          <div className="regular-coach-banner">
            <span className="banner-label">REGULAR SCHEDULED COACH</span>
            <div className="banner-coach-name">
              <span className={`group-color-dot dot-${originalCoach.color || 'cyan'}`} />
              <span>{originalCoach.name}</span>
              {originalCoach.isHeadCoach && <span className="head-badge">Head Coach</span>}
            </div>
          </div>
        )}

        {/* Covering Coach */}
        <CoachSelector
          id="coveringCoachSelect"
          label="Covering Staff / Coach *"
          multiple={false}
          valueKey="id"
          value={assignedCoachId}
          required={true}
          allowUnassigned={false}
          onChange={val => setAssignedCoachId(typeof val === 'string' ? val : val[0] || '')}
          badgeFilter={c => c.id === currentSession?.defaultCoachId ? 'Regular Coach' : 'Cover Substitute'}
        />

        {/* Reason for Cover */}
        <div className="form-field">
          <label htmlFor="overrideReasonSelect">Reason for Cover</label>
          <select
            id="overrideReasonSelect"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            {REASONS.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="form-field">
          <label htmlFor="overrideNotesInput">Notes / Handover Instructions</label>
          <textarea
            id="overrideNotesInput"
            rows={2}
            placeholder="e.g. Sarah on annual leave. Handover notes left in Head Coach briefing for this session."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

