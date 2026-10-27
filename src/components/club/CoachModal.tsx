import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { GROUP_COLORS } from '../../lib/constants';
import type { Coach, CoachRole, GroupColor } from '../../types';

export interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoachId?: string | null;
}

const COACH_ROLES: { value: CoachRole; label: string }[] = [
  { value: 'head_coach', label: 'Head Coach' },
  { value: 'coach', label: 'Coach / Squad Lead' },
  { value: 'assistant_coach', label: 'Assistant Coach' },
  { value: 'guest_coach', label: 'Guest / Specialist Coach' }
];

export function CoachModal({ isOpen, onClose, initialCoachId = null }: CoachModalProps) {
  const { club, saveCoach } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState<CoachRole>('coach');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [certifications, setCertifications] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<GroupColor>('cyan');
  const [isHeadCoach, setIsHeadCoach] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCoachId) {
        const found = (club.coaches || []).find(c => c.id === initialCoachId);
        if (found) {
          setName(found.name);
          setRole(found.role);
          setEmail(found.email || '');
          setPhone(found.phone || '');
          setCertifications(found.certifications || '');
          setNotes(found.notes || '');
          setColor(found.color || 'cyan');
          setIsHeadCoach(Boolean(found.isHeadCoach));
          return;
        }
      }
      setName('');
      setRole('coach');
      setEmail('');
      setPhone('');
      setCertifications('Swim England Coach (Level 2)');
      setNotes('');
      setColor('cyan');
      setIsHeadCoach(false);
    }
  }, [isOpen, initialCoachId, club.coaches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ok = saveCoach(
      {
        name: name.trim(),
        role: isHeadCoach ? 'head_coach' : role,
        email: email.trim(),
        phone: phone.trim(),
        certifications: certifications.trim(),
        notes: notes.trim(),
        color,
        isHeadCoach
      },
      initialCoachId
    );

    if (ok) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCoachId ? 'Edit Coach Profile' : 'Add Club Staff / Coach'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="coach-form" className="btn btn-primary">
            <Icon name="check" size={16} />
            <span>{initialCoachId ? 'Save Coach Profile' : 'Add Coach'}</span>
          </button>
        </>
      }
    >
      <form id="coach-form" className="modal-form" onSubmit={handleSubmit}>
        <p className="modal-desc">
          Manage coaching staff details, certifications, and default squad/session responsibilities.
        </p>

        <div className="form-field">
          <label htmlFor="coachNameInput">Coach Full Name *</label>
          <input
            type="text"
            id="coachNameInput"
            placeholder="e.g. Coach Sarah Jenkins"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="coachRoleSelect">Coaching Role</label>
            <select
              id="coachRoleSelect"
              value={role}
              onChange={e => {
                const r = e.target.value as CoachRole;
                setRole(r);
                if (r === 'head_coach') setIsHeadCoach(true);
              }}
            >
              {COACH_ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Head Coach Privilege</label>
            <label className="checkbox-label" style={{ marginTop: '0.6rem' }}>
              <input
                type="checkbox"
                checked={isHeadCoach}
                onChange={e => {
                  setIsHeadCoach(e.target.checked);
                  if (e.target.checked) setRole('head_coach');
                }}
              />
              <span>Designate as Head Coach</span>
            </label>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="coachCertsInput">Certifications & Accreditations</label>
          <input
            type="text"
            id="coachCertsInput"
            placeholder="e.g. Swim England Level 3 Senior Coach, NPLQ, Safeguarding"
            value={certifications}
            onChange={e => setCertifications(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="coachEmailInput">Email Address</label>
            <input
              type="email"
              id="coachEmailInput"
              placeholder="coach@club.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="coachPhoneInput">Phone Number</label>
            <input
              type="tel"
              id="coachPhoneInput"
              placeholder="+44 7700 900123"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label>Profile Color Accent</label>
          <div className="color-swatches">
            {GROUP_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                className={`swatch-btn ${color === c.id ? 'active' : ''}`}
                style={{ backgroundColor: `var(--accent-${c.id}, #00E5FF)` }}
                onClick={() => setColor(c.id)}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="coachNotesInput">Coaching Philosophy / Notes</label>
          <textarea
            id="coachNotesInput"
            rows={2}
            placeholder="e.g. Focus on distance per stroke, underwater kick technique, and athlete longevity."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

