import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import type { Gender, Swimmer } from '../../types';

export interface SwimmerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSwimmer?: Swimmer | null;
}

export function SwimmerFormModal({ isOpen, onClose, editingSwimmer = null }: SwimmerFormModalProps) {
  const { club, activeGroupId, saveSwimmer } = useApp();

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(activeGroupId || '');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('');
  const [pb50m, setPb50m] = useState('');
  const [pb100m, setPb100m] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingSwimmer) {
      setName(editingSwimmer.name || '');
      setGroupId(activeGroupId || club.groups[0]?.id || '');
      setAge(editingSwimmer.age !== '' && editingSwimmer.age !== undefined ? String(editingSwimmer.age) : '');
      setGender(editingSwimmer.gender || '');
      setPb50m(editingSwimmer.pb50m || '');
      setPb100m(editingSwimmer.pb100m || '');
      setNotes(editingSwimmer.notes || '');
    } else {
      setName('');
      setGroupId(activeGroupId || club.groups[0]?.id || '');
      setAge('');
      setGender('');
      setPb50m('');
      setPb100m('');
      setNotes('');
    }
  }, [isOpen, editingSwimmer, activeGroupId, club.groups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = saveSwimmer(
      { name, age: age ? Number(age) : '', gender, pb50m, pb100m, notes },
      groupId,
      editingSwimmer?.id || null
    );
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSwimmer ? 'Edit Swimmer Details' : 'Add Swimmer'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="swimmer-form" className="btn btn-primary">
            Save Swimmer
          </button>
        </>
      }
    >
      <form id="swimmer-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="swimmerNameField">Full Name *</label>
          <input
            type="text"
            id="swimmerNameField"
            placeholder="e.g. Jordan Taylor"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label htmlFor="swimmerGroupField">Squad / Group</label>
            <select
              id="swimmerGroupField"
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
            >
              {club.groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="swimmerAgeField">Age</label>
            <input
              type="number"
              id="swimmerAgeField"
              min="4"
              max="99"
              placeholder="e.g. 15"
              value={age}
              onChange={e => setAge(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="swimmerGenderField">Category / Gender</label>
            <select
              id="swimmerGenderField"
              value={gender}
              onChange={e => setGender(e.target.value as Gender)}
            >
              <option value="">—</option>
              <option value="F">Female (F)</option>
              <option value="M">Male (M)</option>
              <option value="X">Open / Mixed</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="swimmerPb50Field">50m PB</label>
            <input
              type="text"
              id="swimmerPb50Field"
              placeholder="e.g. 26.40"
              value={pb50m}
              onChange={e => setPb50m(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="swimmerPb100Field">100m PB</label>
            <input
              type="text"
              id="swimmerPb100Field"
              placeholder="e.g. 57.80"
              value={pb100m}
              onChange={e => setPb100m(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="swimmerNotesField">Coach Notes / Target Pace</label>
          <input
            type="text"
            id="swimmerNotesField"
            placeholder="e.g. Distance specialist, breathe every 3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

