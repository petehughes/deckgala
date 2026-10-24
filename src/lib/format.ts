export function formatMs(ms: number | null | undefined, showHundredths: boolean = true): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '--:--';
  const clamped = Math.max(0, ms);
  const totalHundredths = Math.floor(clamped / 10);
  const hundredths = totalHundredths % 100;
  const totalSeconds = Math.floor(totalHundredths / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');
  const hunStr = String(hundredths).padStart(2, '0');

  return showHundredths ? `${minStr}:${secStr}.${hunStr}` : `${minStr}:${secStr}`;
}

export function formatShortSec(ms: number): string {
  const sec = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function sanitizeFilename(name: string | null | undefined): string {
  return String(name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '') || 'export';
}

