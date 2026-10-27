import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { buildSwimmerExportPayload } from '../../lib/exporters';
import { buildSwimmerQrPayload, generateQrDataUrl, type SwimmerQrPayloadResult } from '../../lib/qr';
import { downloadFile, downloadDataUrl } from '../../lib/files';
import { sanitizeFilename } from '../../lib/format';
import { Icon } from '../common/Icon';
import { Modal } from '../common/Modal';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: 'club' | 'group';
}

export function ExportModal({ isOpen, onClose, initialScope = 'club' }: ExportModalProps) {
  const { club, activeGroupId, showToast } = useApp();

  const [scope, setScope] = useState<'club' | 'group'>(initialScope);
  const [method, setMethod] = useState<'file' | 'qr'>('file');
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [groupId, setGroupId] = useState(activeGroupId || club.groups[0]?.id || '');

  const [qrPayload, setQrPayload] = useState<SwimmerQrPayloadResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScope(initialScope);
      setGroupId(activeGroupId || club.groups[0]?.id || '');
      setMethod('file');
    }
  }, [isOpen, initialScope, activeGroupId, club.groups]);

  // Update QR payload whenever scope, groupId, or club changes
  useEffect(() => {
    if (!isOpen) return;

    const payload = buildSwimmerQrPayload(club, { scope, groupId });
    setQrPayload(payload);

    if (method === 'qr' && payload) {
      setQrLoading(true);
      generateQrDataUrl(payload.json, { width: 320, margin: 2 })
        .then(url => {
          setQrDataUrl(url);
          setQrLoading(false);
        })
        .catch(err => {
          showToast(`Error generating QR code: ${err instanceof Error ? err.message : String(err)}`, 'danger');
          setQrLoading(false);
        });
    }
  }, [isOpen, scope, groupId, method, club, showToast]);

  const handleDownloadFile = () => {
    const payload = buildSwimmerExportPayload(club, { scope, format, groupId });
    if (!payload) {
      showToast('Select a valid group to export', 'warning');
      return;
    }
    downloadFile(payload.content, payload.filename, payload.mimeType);
    showToast(payload.summary, 'success');
    onClose();
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl || !qrPayload) return;
    const targetSlug = sanitizeFilename(qrPayload.title);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${targetSlug}-qr-${dateStr}.png`;
    downloadDataUrl(qrDataUrl, filename);
    showToast(`Downloaded QR Code for ${qrPayload.title}`, 'success');
  };

  const handleCopyPayloadJson = async () => {
    if (!qrPayload) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(qrPayload.json);
        showToast('Copied JSON payload to clipboard', 'info');
      } else {
        showToast('Clipboard API not available in this environment', 'warning');
      }
    } catch {
      showToast('Failed to copy to clipboard', 'warning');
    }
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
            {method === 'qr' ? 'Close' : 'Cancel'}
          </button>
          {method === 'file' ? (
            <button type="button" className="btn btn-primary" onClick={handleDownloadFile}>
              Download Export File
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!qrDataUrl || qrLoading}
              onClick={handleDownloadQrImage}
            >
              <Icon name="download" size={16} />
              <span>Download QR Image</span>
            </button>
          )}
        </>
      }
    >
      <p className="modal-desc">
        Export your roster at a <strong>Club level</strong> (all groups &amp; swimmers) or{' '}
        <strong>Group level</strong> (single squad) via <strong>QR Code</strong> or downloadable file.
      </p>

      <div className="modal-form">
        {/* Export Scope */}
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
              <span>Entire Club ({club.groups.length} squads)</span>
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

        {/* Export Method: File vs QR Code */}
        <div className="form-field">
          <label>Export Option</label>
          <div className="radio-pill-group">
            <label className={`radio-pill ${method === 'file' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportMethod"
                value="file"
                checked={method === 'file'}
                onChange={() => setMethod('file')}
              />
              <Icon name="download" size={15} />
              <span>Download File (JSON / CSV)</span>
            </label>
            <label className={`radio-pill ${method === 'qr' ? 'active' : ''}`}>
              <input
                type="radio"
                name="exportMethod"
                value="qr"
                checked={method === 'qr'}
                onChange={() => setMethod('qr')}
              />
              <Icon name="qr" size={15} />
              <span>Generate QR Code</span>
            </label>
          </div>
        </div>

        {/* Method 1: File Format Options */}
        {method === 'file' && (
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
        )}

        {/* Method 2: Live QR Code Card */}
        {method === 'qr' && (
          <div className="qr-export-container">
            <div className="qr-code-frame">
              {qrLoading ? (
                <div className="qr-loading-placeholder">
                  <div className="spinner" />
                  <span>Generating QR Code...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${qrPayload?.title || 'swimmer export'}`}
                  className="qr-code-img"
                />
              ) : (
                <div className="qr-loading-placeholder">
                  <span>Unable to render QR code</span>
                </div>
              )}
            </div>

            {qrPayload && (
              <div className="qr-payload-info">
                <div className="qr-meta-row">
                  <span className="qr-target-badge">{qrPayload.scope.toUpperCase()} LEVEL</span>
                  <span className="qr-target-title">{qrPayload.title}</span>
                </div>
                <div className="qr-summary-text">{qrPayload.summary}</div>
                <div className="qr-byte-badge">
                  {qrPayload.byteLength} bytes ·{' '}
                  {qrPayload.isWithinQrLimit ? 'Ready for camera scan' : 'Large payload for QR'}
                </div>

                {!qrPayload.isWithinQrLimit && (
                  <div className="qr-size-warning">
                    <strong>Note:</strong> This full club roster has many swimmers and creates a dense QR code.
                    If another phone has trouble scanning it, export individual groups or download the JSON file.
                  </div>
                )}

                <div className="qr-action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleDownloadQrImage}
                    disabled={!qrDataUrl}
                  >
                    <Icon name="download" size={14} />
                    <span>Save PNG Image</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleCopyPayloadJson}
                    title="Copy minified JSON data"
                  >
                    <Icon name="copy" size={14} />
                    <span>Copy JSON</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
