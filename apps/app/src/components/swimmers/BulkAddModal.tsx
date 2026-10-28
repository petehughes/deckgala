import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getActiveGroup } from '../../lib/roster';
import { Modal } from '../common/Modal';

export interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkAddModal({ isOpen, onClose }: BulkAddModalProps) {
  const { club, activeGroupId, bulkAddSwimmers } = useApp();
  const activeGroup = getActiveGroup(club, activeGroupId);

  const [rawText, setRawText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRawText('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!activeGroup) return;
    const ok = bulkAddSwimmers(rawText, activeGroup.id);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Add Swimmers${activeGroup ? ` to ${activeGroup.name}` : ''}`}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Add Swimmers
          </button>
        </>
      }
    >
      <p className="modal-desc">
        Enter one swimmer per line. Optionally use commas for details:{' '}
        <code>Name, Age, Gender, 50mPB, 100mPB, Notes</code>
      </p>
      <div className="modal-form">
        <div className="form-field">
          <label htmlFor="bulkSwimmersTextarea">Swimmers List</label>
          <textarea
            id="bulkSwimmersTextarea"
            className="swimmers-textarea bulk-textarea"
            placeholder={
              'Alex Rivera, 16, M, 24.80, 53.90, Captain\nSam Chen, 15, M, 26.10, 57.20\nJamie Patel\nMorgan Vance'
            }
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}

