import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseImportFileText } from '../../lib/exporters';
import { playBeep } from '../../lib/audio';
import { Icon } from '../common/Icon';
import { Modal } from '../common/Modal';
import { QrScanner } from '../common/QrScanner';
import type { PendingImport } from '../../types';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: 'file' | 'qr';
}

export function ImportModal({ isOpen, onClose, initialSource = 'file' }: ImportModalProps) {
  const { club, activeGroupId, executeImport, showToast } = useApp();

  const [source, setSource] = useState<'file' | 'qr'>(initialSource);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [targetScope, setTargetScope] = useState<'club' | 'group'>('club');
  const [clubImportMode, setClubImportMode] = useState<'merge' | 'replace'>('merge');
  const [groupImportTarget, setGroupImportTarget] = useState('__new__');
  const [newGroupName, setNewGroupName] = useState('');
  const [importOrigin, setImportOrigin] = useState<'file' | 'qr'>('file');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSource(initialSource);
      setPendingImport(null);
      setTargetScope('club');
      setClubImportMode('merge');
      setGroupImportTarget(activeGroupId || '__new__');
      setNewGroupName('');
      setImportOrigin(initialSource);
    }
  }, [isOpen, initialSource, activeGroupId]);

  const handleRawText = (text: string, sourceLabel: string, isQr: boolean = false) => {
    try {
      const parsed = parseImportFileText(text, sourceLabel, club.clubName);
      setPendingImport(parsed);
      setTargetScope(parsed.detectedScope);
      setImportOrigin(isQr ? 'qr' : 'file');
      setNewGroupName(parsed.groups[0]?.name || (isQr ? 'Scanned Squad' : sourceLabel.replace(/\.[^.]+$/, '')));

      if (parsed.detectedScope === 'group') {
        setGroupImportTarget('__new__');
      }

      if (isQr) {
        playBeep('split');
        showToast(
          `QR code detected: ${parsed.groups.length} group${parsed.groups.length === 1 ? '' : 's'}, ${parsed.totalSwimmers} swimmer${parsed.totalSwimmers === 1 ? '' : 's'}`,
          'success'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid format or structure';
      showToast(`Import error: ${msg}`, 'danger');
    }
  };

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      handleRawText(String(e.target?.result || ''), file.name, false);
    };
    reader.readAsText(file);
  };

  const handleQrScan = (decodedText: string) => {
    handleRawText(decodedText, 'QR Code Scan', true);
  };

  const handleReset = () => {
    setPendingImport(null);
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
      title="Import Swimmers & Groups"
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
        Import swimmers at a <strong>Club level</strong> (all squads) or{' '}
        <strong>Group level</strong> (single squad) by uploading a file or scanning a QR code.
      </p>

      <div className="modal-form">
        {/* Source Toggle: File vs QR Scanner */}
        {!pendingImport && (
          <div className="form-field">
            <label>Import Method</label>
            <div className="radio-pill-group">
              <label className={`radio-pill ${source === 'file' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="importMethodSource"
                  value="file"
                  checked={source === 'file'}
                  onChange={() => setSource('file')}
                />
                <Icon name="upload" size={15} />
                <span>Upload File (JSON / CSV)</span>
              </label>
              <label className={`radio-pill ${source === 'qr' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="importMethodSource"
                  value="qr"
                  checked={source === 'qr'}
                  onChange={() => setSource('qr')}
                />
                <Icon name="qr" size={15} />
                <span>Scan QR Code</span>
              </label>
            </div>
          </div>
        )}

        {/* Source 1: File Dropzone */}
        {!pendingImport && source === 'file' && (
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
                Click to choose a .json or .csv file (or drag & drop)
              </span>
            </div>
          </div>
        )}

        {/* Source 2: QR Scanner (Camera / Image / Paste) */}
        {!pendingImport && source === 'qr' && (
          <QrScanner onScan={handleQrScan} />
        )}

        {/* Preview and Configuration Step */}
        {pendingImport && (
          <div className="import-preview-box">
            <div className="import-preview-header">
              <div className="import-origin-tag">
                <Icon name={importOrigin === 'qr' ? 'qr' : 'upload'} size={14} />
                <span>{importOrigin === 'qr' ? 'SCANNED VIA QR CODE' : 'FILE LOADED'}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleReset}
                title="Choose or scan another item"
              >
                Clear / Re-scan
              </button>
            </div>

            <div className="import-preview-summary">
              <strong>{pendingImport.fileName}</strong> — Detected{' '}
              <strong>{pendingImport.groups.length}</strong> group
              {pendingImport.groups.length === 1 ? '' : 's'} and{' '}
              <strong>{pendingImport.totalSwimmers}</strong> swimmer
              {pendingImport.totalSwimmers === 1 ? '' : 's'}.
            </div>

            {/* Target Import Scope */}
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
                  <span>Club Level (All Groups + Swimmers)</span>
                </label>
                <label className={`radio-pill ${targetScope === 'group' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="importTargetScope"
                    value="group"
                    checked={targetScope === 'group'}
                    onChange={() => setTargetScope('group')}
                  />
                  <span>Into a Specific Swimming Group</span>
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
                    Merge with existing club groups (keep current squads &amp; add/update)
                  </option>
                  <option value="replace">
                    Replace entire club roster with imported squads
                  </option>
                </select>
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label htmlFor="groupImportTargetSelect">Target Swimming Group</label>
                  <select
                    id="groupImportTargetSelect"
                    value={groupImportTarget}
                    onChange={e => setGroupImportTarget(e.target.value)}
                  >
                    <option value="__new__">+ Create New Group from Import</option>
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
