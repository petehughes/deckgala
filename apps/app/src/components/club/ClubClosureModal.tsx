import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import type { ClubClosure } from '../../types';

export interface ClubClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClosureId?: string | null;
}

export function ClubClosureModal({
  isOpen,
  onClose,
  initialClosureId = null
}: ClubClosureModalProps) {
  const { club, saveClubClosure, deleteClubClosure } = useApp();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialClosureId) {
        const found = (club.clubClosures || []).find(c => c.id === initialClosureId);
        if (found) {
          setTitle(found.title);
          setStartDate(found.startDate);
          setEndDate(found.endDate);
          setReason(found.reason || '');
          return;
        }
      }
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setStartDate(today);
      setEndDate(today);
      setReason('');
    }
  }, [isOpen, initialClosureId, club.clubClosures]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    const ok = saveClubClosure(
      {
        title: title.trim(),
        startDate,
        endDate,
        reason: reason.trim()
      },
      initialClosureId
    );

    if (ok) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (initialClosureId) {
      deleteClubClosure(initialClosureId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClosureId ? 'Edit Club Closure Period' : 'Add Club Closure / Holiday Period'}
      size="md"
      footer={
        <>
          {initialClosureId && (
            <button
              type="button"
              className="btn btn-outline-danger"
              style={{ marginRight: 'auto' }}
              onClick={handleDelete}
            >
              <Icon name="trash" size={14} />
              <span>Delete Closure</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="club-closure-form" className="btn btn-primary">
            <Icon name="check" size={16} />
            <span>{initialClosureId ? 'Save Changes' : 'Schedule Closure'}</span>
          </button>
        </>
      }
    >
      <form id="club-closure-form" className="modal-form" onSubmit={handleSubmit}>
        <p className="modal-desc">
          Schedule club closure dates (e.g. Christmas, Easter, pool maintenance shutdowns). Sessions scheduled during these dates will be clearly marked as closed on the calendar.
        </p>

        <div className="form-field">
          <label htmlFor="closureTitleInput">Closure Title *</label>
          <input
            type="text"
            id="closureTitleInput"
            placeholder="e.g. Christmas & New Year Holiday Closure"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="closureStartDate">Closure Starts *</label>
            <input
              type="date"
              id="closureStartDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="closureEndDate">Closure Ends *</label>
            <input
              type="date"
              id="closureEndDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="closureReasonInput">Reason / Member Notice</label>
          <textarea
            id="closureReasonInput"
            rows={2}
            placeholder="e.g. Leisure center closed for annual holiday maintenance. Normal timetable resumes on Jan 3rd."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

