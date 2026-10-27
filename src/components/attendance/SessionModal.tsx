import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';

export interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialPrompt?: boolean;
}

export function SessionModal({ isOpen, onClose, isInitialPrompt = false }: SessionModalProps) {
  const { config, club, updateSessionDetails, setCurrentView } = useApp();

  const [sessionName, setSessionName] = useState(config.sessionName || 'Morning Training Session');
  const [sessionDate, setSessionDate] = useState(config.sessionDate || new Date().toISOString().slice(0, 10));
  const [sessionTime, setSessionTime] = useState(config.sessionTime || new Date().toTimeString().slice(0, 5));
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(config.selectedGroupIds || []);

  useEffect(() => {
    if (isOpen) {
      setSessionName(config.sessionName || 'Morning Training Session');
      setSessionDate(config.sessionDate || new Date().toISOString().slice(0, 10));
      setSessionTime(config.sessionTime || new Date().toTimeString().slice(0, 5));
      setSelectedGroupIds(config.selectedGroupIds || []);
    }
  }, [isOpen, config.sessionName, config.sessionDate, config.sessionTime, config.selectedGroupIds]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllSquads = () => {
    setSelectedGroupIds(club.groups.map(g => g.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSessionDetails({
      sessionName: sessionName.trim() || 'Training Session',
      sessionDate,
      sessionTime,
      selectedGroupIds
    });
    onClose();
    if (isInitialPrompt) {
      setCurrentView('attendance');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isInitialPrompt ? 'Welcome to DeckGala — Start Session' : 'Edit Session Details'}
      size="md"
      footer={
        <>
          {!isInitialPrompt && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button type="submit" form="session-details-form" className="btn btn-primary">
            {isInitialPrompt ? 'Begin Session & Attendance →' : 'Save Session Details'}
          </button>
        </>
      }
    >
      <form id="session-details-form" className="modal-form" onSubmit={handleSubmit}>
        <p className="modal-desc">
          {isInitialPrompt
            ? 'Set up today’s training session name, date, time, and active squads. These details will be recorded with all split times and can be changed later anytime.'
            : 'Update the session metadata used in exports, clipboard summaries, and recorded times.'}
        </p>

        <div className="form-field">
          <label htmlFor="sessionModalName">Session Name *</label>
          <input
            type="text"
            id="sessionModalName"
            placeholder="e.g. Morning Aerobic Threshold"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            autoFocus={isInitialPrompt}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="sessionModalDate">Session Date</label>
            <input
              type="date"
              id="sessionModalDate"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="sessionModalTime">Session Time</label>
            <input
              type="time"
              id="sessionModalTime"
              value={sessionTime}
              onChange={e => setSessionTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <div className="section-title-row" style={{ marginBottom: '0.4rem' }}>
            <label style={{ margin: 0 }}>Active Squads in this Session</label>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleSelectAllSquads}
            >
              Select All Squads
            </button>
          </div>

          {club.groups.length === 0 ? (
            <p className="config-help">No squads exist yet. You can create squads in the Swimmers tab.</p>
          ) : (
            <div className="session-modal-groups-grid">
              {club.groups.map(grp => {
                const isChecked = selectedGroupIds.includes(grp.id);
                return (
                  <div
                    key={grp.id}
                    className={`session-group-chip ${isChecked ? 'selected' : ''}`}
                    onClick={() => toggleGroup(grp.id)}
                  >
                    <span className="chip-check">{isChecked ? '✓' : ''}</span>
                    <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                    <div className="chip-info">
                      <span className="chip-name">{grp.name}</span>
                      <span className="chip-meta">{grp.swimmers.length} swimmer{grp.swimmers.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

