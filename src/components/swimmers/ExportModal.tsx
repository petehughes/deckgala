import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { buildSwimmerExportPayload } from '../../lib/exporters';
import { downloadFile } from '../../lib/files';
import { Modal } from '../common/Modal';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: 'club' | 'group';
}

export function ExportModal({ isOpen, onClose, initialScope = 'club' }: ExportModalProps) {
  const { club, activeGroupId, showToast } = useApp();

  const [scope, setScope] = useState<'club' | 'group'>(initialScope);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [groupId, setGroupId] = useState(activeGroupId || club.groups[0]?.id || '');

  useEffect(() => {
    if (isOpen) {
      setScope(initialScope);
      setGroupId(activeGroupId || club.groups[0]?.id || '');
    }
  }, [isOpen, initialScope, activeGroupId, club.groups]);

  const handleDownload = () => {
    const payload = buildSwimmerExportPayload(club, { scope, format, groupId });
    if (!payload) {
      showToast('Select a valid group to export', 'warning');
      return;
    }
    downloadFile(payload.content, payload.filename, payload.mimeType);
    showToast(payload.summary, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Swimmers & Groups"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            Download Export File
          </button>
        </>
      }
    >
      <p className="modal-desc">
        Export your roster at a <strong>Club level</strong> (all groups &amp; swimmers) or{' '}
        <strong>Group level</strong> (single squad) in JSON or CSV format.
      </p>
      <div className="modal-form">
        <div className="form-field">
          <label>Export Level</label>
          <div className="radio-pill-group">
            <label className={`radio-pill ${scope === 'club' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportScope"
                value="club"
                checked={scope === 'club'}
                onChange={() => setScope('club')}
              />
              <span>Entire Club (All Groups)</span>
            </label>
            <label className={`radio-pill ${scope === 'group' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportScope"
                value="group"
                checked={scope === 'group'}
                onChange={() => setScope('group')}
              />
              <span>Single Swimming Group</span>
            </label>
          </div>
        </div>

        {scope === 'group' && (
          <div className="form-field">
            <label htmlFor="exportGroupSelect">Select Group to Export</label>
            <select
              id="exportGroupSelect"
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
            >
              {club.groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.swimmers.length} swimmers)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label>File Format</label>
          <div className="radio-pill-group">
            <label className={`radio-pill ${format === 'json' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
              />
              <span>JSON (Full Backup &amp; Metadata)</span>
            </label>
            <label className={`radio-pill ${format === 'csv' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
              />
              <span>CSV (Spreadsheet Compatible)</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

