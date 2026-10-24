import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseImportFileText } from '../../lib/exporters';
import { Icon } from '../common/Icon';
import { Modal } from '../common/Modal';
import type { PendingImport } from '../../types';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { club, activeGroupId, executeImport, showToast } = useApp();

  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [targetScope, setTargetScope] = useState<'club' | 'group'>('club');
  const [clubImportMode, setClubImportMode] = useState<'merge' | 'replace'>('merge');
  const [groupImportTarget, setGroupImportTarget] = useState('__new__');
  const [newGroupName, setNewGroupName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingImport(null);
      setTargetScope('club');
      setClubImportMode('merge');
      setGroupImportTarget('__new__');
      setNewGroupName('');
    }
  }, [isOpen]);

  const handleFileText = (text: string, fileName: string) => {
    try {
      const parsed = parseImportFileText(text, fileName, club.clubName);
      setPendingImport(parsed);
      setTargetScope(parsed.detectedScope);
      setNewGroupName(parsed.groups[0]?.name || fileName.replace(/\.[^.]+$/, ''));
      if (parsed.detectedScope === 'group' && activeGroupId) {
        setGroupImportTarget('__new__');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid file format';
      showToast(`Import error: ${msg}`, 'danger');
    }
  };

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      handleFileText(String(e.target?.result || ''), file.name);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!pendingImport) return;
    const ok = executeImport(pendingImport, {
      targetScope,
      clubImportMode,
      groupImportTarget,
      newGroupName
    });
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Swimmers / Club Roster"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pendingImport}
            onClick={handleConfirm}
          >
            Import Now
          </button>
        </>
      }
    >
      <p className="modal-desc">
        Import a <strong>Club JSON/CSV</strong> or a <strong>Single Group JSON/CSV</strong> file.
      </p>

      <div className="modal-form">
        <div
          className="file-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFileSelect(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <div className="dropzone-content">
            <Icon name="upload" size={28} />
            <span className="dropzone-label">
              {pendingImport
                ? `Loaded: ${pendingImport.fileName}`
                : 'Click to choose a .json or .csv file (or drag & drop)'}
            </span>
          </div>
        </div>

        {pendingImport && (
          <div className="import-preview-box">
            <div className="import-preview-summary">
              <strong>{pendingImport.fileName}</strong> — Detected{' '}
              <strong>{pendingImport.groups.length}</strong> group
              {pendingImport.groups.length === 1 ? '' : 's'} and{' '}
              <strong>{pendingImport.totalSwimmers}</strong> swimmer
              {pendingImport.totalSwimmers === 1 ? '' : 's'}.
            </div>

            <div className="form-field">
              <label>Import Level</label>
              <div className="radio-pill-group">
                <label className={`radio-pill ${targetScope === 'club' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="importTargetScope"
                    value="club"
                    checked={targetScope === 'club'}
                    onChange={() => setTargetScope('club')}
                  />
                  <span>Club Level (Groups + Swimmers)</span>
                </label>
                <label className={`radio-pill ${targetScope === 'group' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="importTargetScope"
                    value="group"
                    checked={targetScope === 'group'}
                    onChange={() => setTargetScope('group')}
                  />
                  <span>Into a Specific Group</span>
                </label>
              </div>
            </div>

            {targetScope === 'club' ? (
              <div className="form-field">
                <label htmlFor="clubImportModeSelect">Club Import Mode</label>
                <select
                  id="clubImportModeSelect"
                  value={clubImportMode}
                  onChange={e => setClubImportMode(e.target.value as 'merge' | 'replace')}
                >
                  <option value="merge">
                    Merge with existing club groups (keep current groups &amp; add/update)
                  </option>
                  <option value="replace">
                    Replace entire club roster with imported file
                  </option>
                </select>
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label htmlFor="groupImportTargetSelect">Target Group</label>
                  <select
                    id="groupImportTargetSelect"
                    value={groupImportTarget}
                    onChange={e => setGroupImportTarget(e.target.value)}
                  >
                    <option value="__new__">+ Create New Group from File</option>
                    {club.groups.map(g => (
                      <option key={g.id} value={g.id}>
                        Merge into &quot;{g.name}&quot; ({g.swimmers.length} swimmers)
                      </option>
                    ))}
                  </select>
                </div>

                {groupImportTarget === '__new__' && (
                  <div className="form-field">
                    <label htmlFor="importNewGroupNameInput">New Group Name</label>
                    <input
                      type="text"
                      id="importNewGroupNameInput"
                      placeholder="e.g. Regional Squad"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

