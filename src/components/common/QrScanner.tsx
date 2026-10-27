import React, { useState, useRef, useEffect, useCallback } from 'react';
import { decodeQrFromVideoFrame, decodeQrFromImageFile } from '../../lib/qr';
import { Icon } from './Icon';

export interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onCancel?: () => void;
  className?: string;
}

type ScanMode = 'camera' | 'image' | 'paste';

export function QrScanner({ onScan, onCancel, className = '' }: QrScannerProps) {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [imageDecoding, setImageDecoding] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current video stream
  const stopStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Check for available cameras
  useEffect(() => {
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          // Ignore enumeration errors
        });
    }
  }, []);

  // Start camera stream when in camera mode
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser. Try uploading a QR code image below.');
      setMode('image');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowedError')) {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings, or upload an image below.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device. Please upload an image or paste JSON below.');
      } else {
        setCameraError(`Unable to start camera (${msg}). Please upload an image or paste JSON.`);
      }
      setMode('image');
    }
  }, [facingMode, stopStream]);

  // Handle continuous video scanning
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [mode, startCamera, stopStream]);

  // Frame processing loop
  useEffect(() => {
    if (!isScanning) return;

    let active = true;
    let lastScanTime = 0;

    const tick = (now: number) => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Throttle scanning to every 120ms to preserve CPU/battery
      if (video && canvas && video.readyState >= 2 && now - lastScanTime >= 120) {
        lastScanTime = now;
        try {
          const decoded = decodeQrFromVideoFrame(video, canvas);
          if (decoded && active) {
            active = false;
            stopStream();
            onScan(decoded);
            return;
          }
        } catch {
          // Keep ticking on frame capture errors
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isScanning, onScan, stopStream]);

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    setImageDecoding(true);
    setCameraError(null);
    try {
      const decoded = await decodeQrFromImageFile(file);
      if (decoded) {
        onScan(decoded);
      } else {
        setCameraError('No valid QR code was detected in the selected image. Please try a clearer picture.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to decode image';
      setCameraError(`Image decode error: ${msg}`);
    } finally {
      setImageDecoding(false);
    }
  };

  const handlePasteSubmit = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setCameraError('Please paste valid QR text or JSON payload.');
      return;
    }
    onScan(trimmed);
  };

  return (
    <div className={`qr-scanner-widget ${className}`}>
      {/* Hidden scratch canvas for video frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Mode Tabs */}
      <div className="qr-scanner-tabs">
        <button
          type="button"
          className={`qr-tab-btn ${mode === 'camera' ? 'active' : ''}`}
          onClick={() => setMode('camera')}
        >
          <Icon name="camera" size={16} />
          <span>Live Camera</span>
        </button>
        <button
          type="button"
          className={`qr-tab-btn ${mode === 'image' ? 'active' : ''}`}
          onClick={() => setMode('image')}
        >
          <Icon name="upload" size={16} />
          <span>Upload Image</span>
        </button>
        <button
          type="button"
          className={`qr-tab-btn ${mode === 'paste' ? 'active' : ''}`}
          onClick={() => setMode('paste')}
        >
          <Icon name="edit" size={16} />
          <span>Paste Text</span>
        </button>
      </div>

      {cameraError && (
        <div className="qr-scanner-alert" role="alert">
          <Icon name="undo" size={16} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Mode: Camera Viewfinder */}
      {mode === 'camera' && (
        <div className="qr-camera-viewport">
          <video ref={videoRef} className="qr-video-feed" playsInline muted />
          <div className="qr-viewfinder-overlay">
            <div className="qr-reticle">
              <span className="corner top-left" />
              <span className="corner top-right" />
              <span className="corner bottom-left" />
              <span className="corner bottom-right" />
              <div className="qr-scan-line" />
            </div>
            <p className="qr-instruction">Point camera at DeckGala QR Code</p>
          </div>

          <div className="qr-camera-toolbar">
            {hasMultipleCameras && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={toggleFacingMode}
                title="Switch between front and back camera"
              >
                <Icon name="shuffle" size={14} />
                <span>Switch Camera</span>
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  stopStream();
                  onCancel();
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode: Image Upload */}
      {mode === 'image' && (
        <div
          className="qr-image-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            if (file) handleImageFile(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
          />
          <div className="qr-image-drop-inner">
            <Icon name="qr" size={36} />
            <p className="drop-title">
              {imageDecoding ? 'Scanning image...' : 'Click to select or drag a QR code image'}
            </p>
            <p className="drop-sub">Supports PNG, JPG, WebP screenshots or photos</p>
          </div>
        </div>
      )}

      {/* Mode: Paste Text / JSON */}
      {mode === 'paste' && (
        <div className="qr-paste-box">
          <textarea
            className="qr-paste-textarea"
            placeholder={'Paste raw JSON payload or text scanned from another app:\n{"schema":"deckgala_group_v1", ...}'}
            rows={5}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <div className="qr-paste-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!pasteText.trim()}
              onClick={handlePasteSubmit}
            >
              Parse Scanned Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

