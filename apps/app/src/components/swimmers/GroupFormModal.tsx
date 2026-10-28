import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GROUP_COLORS } from '../../lib/constants';
import { Modal } from '../common/Modal';
import { CoachSelector } from '../common/CoachSelector';
import type { GroupColor, SwimmerGroup } from '../../types';

export interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: SwimmerGroup | null;
}

export function GroupFormModal({ isOpen, onClose, editingGroup = null }: GroupFormModalProps) {
  const { saveGroup } = useApp();

  const [name, setName] = useState('');
  const [coach, setCoach] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<GroupColor>('cyan');

  useEffect(() => {
    if (!isOpen) return;
    if (editingGroup) {
      setName(editingGroup.name || '');
      setCoach(editingGroup.coach || '');
      setDescription(editingGroup.description || '');
      setColor(editingGroup.color || 'cyan');
    } else {
      setName('');
      setCoach('');
      setDescription('');
      setColor('cyan');
    }
  }, [isOpen, editingGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = saveGroup({ name, coach, description, color }, editingGroup?.id || null);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGroup ? 'Edit Swimming Group' : 'Create Swimming Group'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="group-form" className="btn btn-primary">
            Save Group
          </button>
        </>
      }
    >
      <form id="group-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="groupNameField">Group / Squad Name *</label>
          <input
            type="text"
            id="groupNameField"
            placeholder="e.g. Senior Performance Squad"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Reusable CoachSelector for one or more coaches */}
        <CoachSelector
          id="groupCoachField"
          label="Squad Coach(es)"
          multiple={true}
          valueKey="name"
          value={coach}
          onChange={val => {
            const str = Array.isArray(val) ? val.join(', ') : val;
            setCoach(str);
          }}
          allowCustomInput={true}
          placeholder="Or type custom coach name..."
        />

        <div className="form-field">
          <label htmlFor="groupDescField">Description / Schedule</label>
          <input
            type="text"
            id="groupDescField"
            placeholder="e.g. National qualifiers & senior competitive athletes"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Squad Color Tag</label>
          <div className="color-picker-row">
            {GROUP_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                className={`color-swatch dot-${c.id} ${color === c.id ? 'selected' : ''}`}
                title={c.label}
                aria-label={c.label}
                onClick={() => setColor(c.id)}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
