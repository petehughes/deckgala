import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { CoachModal } from './CoachModal';
import type { Coach } from '../../types';

export function StaffListView() {
  const { club, deleteCoach } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);

  const coaches = club.coaches || [];

  const handleCreate = () => {
    setEditingCoachId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingCoachId(id);
    setIsModalOpen(true);
  };

  const handleDelete = (coach: Coach) => {
    if (confirm(`Are you sure you want to delete "${coach.name}"?`)) {
      deleteCoach(coach.id);
    }
  };

  return (
    <div className="staff-list-container">
      {/* Header */}
      <div className="staff-list-header">
        <div className="staff-header-info">
          <h3>Club Coaching Staff ({coaches.length})</h3>
          <p className="staff-header-desc">
            Manage your coaching team, designate Head Coach privileges, and configure default assignments for training sessions.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          <Icon name="plus" size={16} />
          <span>+ Add Club Coach</span>
        </button>
      </div>

      {/* Coaches Grid */}
      <div className="coaches-cards-grid">
        {coaches.map(coach => {
          // Find default sessions assigned to this coach
          const assignedSessions = (club.scheduledSessions || []).filter(
            s => s.defaultCoachId === coach.id
          );

          // Find active overrides where this coach is covering
          const coveringCount = (club.staffOverrides || []).filter(
            o => o.assignedCoachId === coach.id
          ).length;

          return (
            <div
              key={coach.id}
              className={`coach-card ${coach.isHeadCoach ? 'is-head-coach' : ''}`}
            >
              <div className="coach-card-header">
                <div className="coach-avatar-wrap">
                  <div
                    className="coach-avatar"
                    style={{ backgroundColor: `var(--accent-${coach.color || 'cyan'}, #00E5FF)` }}
                  >
                    {coach.name.replace('Coach ', '').charAt(0)}
                  </div>
                  <div className="coach-title-block">
                    <div className="coach-name-row">
                      <h4 className="coach-name">{coach.name}</h4>
                      {coach.isHeadCoach && (
                        <span className="head-coach-badge">
                          <Icon name="badge" size={13} />
                          <span>Head Coach</span>
                        </span>
                      )}
                    </div>
                    <span className="coach-role">
                      {coach.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                </div>

                <div className="coach-card-actions">
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    title={`Edit ${coach.name}`}
                    aria-label={`Edit ${coach.name}`}
                    onClick={() => handleEdit(coach.id)}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  {coaches.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-subtle danger"
                      title={`Delete ${coach.name}`}
                      aria-label={`Delete ${coach.name}`}
                      onClick={() => handleDelete(coach)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {coach.certifications && (
                <div className="coach-certs-block">
                  <span className="certs-label">Accreditations:</span>
                  <span className="certs-text">{coach.certifications}</span>
                </div>
              )}

              {/* Contact info */}
              <div className="coach-contact-row">
                {coach.email && (
                  <span className="contact-item">
                    📧 {coach.email}
                  </span>
                )}
                {coach.phone && (
                  <span className="contact-item">
                    📞 {coach.phone}
                  </span>
                )}
              </div>

              {/* Assigned Sessions */}
              <div className="coach-schedule-summary">
                <span className="summary-label">Default Assigned Sessions:</span>
                <span className="summary-val">
                  {assignedSessions.length}{' '}
                  {assignedSessions.length === 1 ? 'weekly session' : 'weekly sessions'}
                </span>
                {coveringCount > 0 && (
                  <span className="covering-badge">
                    Covering {coveringCount} {coveringCount === 1 ? 'session' : 'sessions'}
                  </span>
                )}
              </div>

              {/* Philosophy / Notes */}
              {coach.notes && (
                <p className="coach-notes-text">
                  "{coach.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      <CoachModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoachId(null);
        }}
        initialCoachId={editingCoachId}
      />
    </div>
  );
}

