import QRCode from 'qrcode';
import jsQR from 'jsqr';
import type { ClubData } from '../types';

export const MAX_RECOMMENDED_QR_BYTES = 2800;

export interface SwimmerQrPayloadResult {
  json: string;
  scope: 'club' | 'group';
  title: string;
  summary: string;
  byteLength: number;
  isWithinQrLimit: boolean;
  totalSwimmers: number;
  totalGroups: number;
}

/**
 * Builds a compact, minified JSON payload suitable for QR code encoding
 * for either an individual swimming group or the entire club roster.
 */
export function buildSwimmerQrPayload(
  club: ClubData,
  { scope = 'club', groupId = '' }: { scope?: 'club' | 'group'; groupId?: string }
): SwimmerQrPayloadResult | null {
  if (scope === 'group') {
    const group = club.groups.find(g => g.id === groupId) || club.groups[0];
    if (!group) return null;

    const payload = {
      schema: 'deckgala_group_v1',
      scope: 'group',
      clubName: club.clubName,
      group: {
        name: group.name,
        coach: group.coach || '',
        description: group.description || '',
        color: group.color || 'cyan',
        swimmers: group.swimmers.map(s => {
          const sw: Record<string, unknown> = { name: s.name };
          if (s.age !== '' && s.age !== null && s.age !== undefined) sw.age = s.age;
          if (s.gender) sw.gender = s.gender;
          if (s.pb50m) sw.pb50m = s.pb50m;
          if (s.pb100m) sw.pb100m = s.pb100m;
          if (s.notes) sw.notes = s.notes;
          return sw;
        })
      }
    };

    const json = JSON.stringify(payload);
    const byteLength = new TextEncoder().encode(json).length;

    return {
      json,
      scope: 'group',
      title: `${group.name} Squad`,
      summary: `Squad "${group.name}" · ${group.swimmers.length} swimmer${group.swimmers.length === 1 ? '' : 's'}`,
      byteLength,
      isWithinQrLimit: byteLength <= MAX_RECOMMENDED_QR_BYTES,
      totalSwimmers: group.swimmers.length,
      totalGroups: 1
    };
  }

  // Club level payload
  const totalSwimmers = club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
  const payload = {
    schema: 'deckgala_club_v1',
    scope: 'club',
    clubName: club.clubName,
    groups: club.groups.map(g => ({
      name: g.name,
      coach: g.coach || '',
      color: g.color || 'cyan',
      swimmers: g.swimmers.map(s => {
        const sw: Record<string, unknown> = { name: s.name };
        if (s.age !== '' && s.age !== null && s.age !== undefined) sw.age = s.age;
        if (s.gender) sw.gender = s.gender;
        if (s.pb50m) sw.pb50m = s.pb50m;
        if (s.pb100m) sw.pb100m = s.pb100m;
        return sw;
      })
    }))
  };

  const json = JSON.stringify(payload);
  const byteLength = new TextEncoder().encode(json).length;

  return {
    json,
    scope: 'club',
    title: `${club.clubName} (Entire Club)`,
    summary: `${club.groups.length} squad${club.groups.length === 1 ? '' : 's'} · ${totalSwimmers} swimmer${totalSwimmers === 1 ? '' : 's'}`,
    byteLength,
    isWithinQrLimit: byteLength <= MAX_RECOMMENDED_QR_BYTES,
    totalSwimmers,
    totalGroups: club.groups.length
  };
}

/**
 * Generates a PNG data URL for a given string text.
 */
export async function generateQrDataUrl(
  text: string,
  options: { width?: number; margin?: number } = {}
): Promise<string> {
  const width = options.width ?? 320;
  const margin = options.margin ?? 2;
  const ecLevel = text.length > 1800 ? 'L' : text.length > 900 ? 'M' : 'Q';

  return QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: '#03131a',
      light: '#ffffff'
    }
  });
}

/**
 * Decodes a QR code from a raw ImageData buffer.
 */
export function decodeQrFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  if (!data || width <= 0 || height <= 0) return null;
  const result = jsQR(data, width, height, {
    inversionAttempts: 'attemptBoth'
  });
  return result?.data ? result.data.trim() : null;
}

/**
 * Decodes a QR code from a video frame using a scratch canvas.
 */
export function decodeQrFromVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return decodeQrFromImageData(imgData.data, canvas.width, canvas.height);
}

/**
 * Decodes a QR code from an image file (PNG, JPG, SVG, WebP, etc.)
 */
export function decodeQrFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image format'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = decodeQrFromImageData(imgData.data, canvas.width, canvas.height);
          resolve(decoded);
        } catch (err) {
          reject(err);
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
