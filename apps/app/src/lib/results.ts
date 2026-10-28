import { formatMs } from './format';
import { csvEscape } from './csv';
import type { SwimResult } from '../types';

export interface ResultsKpis {
  totalCount: number;
  fastestText: string;
  fastestSub: string;
  avgText: string;
  wavesCount: number;
}

export function computeResultsKpis(results: SwimResult[] = []): ResultsKpis {
  const totalCount = results.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      fastestText: '--:--',
      fastestSub: 'No splits yet',
      avgText: '--:--',
      wavesCount: 0
    };
  }

  let minRes = results[0];
  let sumMs = 0;
  const wavesSet = new Set<string>();

  results.forEach(r => {
    if (r.netTimeMs < minRes.netTimeMs) minRes = r;
    sumMs += r.netTimeMs;
    wavesSet.add(`${r.setName}-W${r.wave}`);
  });

  const avgMs = sumMs / totalCount;

  return {
    totalCount,
    fastestText: formatMs(minRes.netTimeMs),
    fastestSub: `${minRes.swimmer} (Lane ${minRes.lane})`,
    avgText: formatMs(avgMs),
    wavesCount: wavesSet.size
  };
}

export interface ResultsFilterOptions {
  laneFilter?: string;
  waveFilter?: string;
  sortBy?: 'recent' | 'wave' | 'lane' | 'fastest';
}

export function filterAndSortResults(
  results: SwimResult[] = [],
  { laneFilter = 'all', waveFilter = 'all', sortBy = 'recent' }: ResultsFilterOptions = {}
): SwimResult[] {
  let list = [...results];
  if (laneFilter !== 'all') {
    const laneNum = parseInt(laneFilter, 10);
    list = list.filter(r => r.lane === laneNum);
  }
  if (waveFilter !== 'all') {
    const waveNum = parseInt(waveFilter, 10);
    list = list.filter(r => r.wave === waveNum);
  }

  if (sortBy === 'fastest') {
    list.sort((a, b) => a.netTimeMs - b.netTimeMs);
  } else if (sortBy === 'lane') {
    list.sort((a, b) => a.lane - b.lane || a.wave - b.wave);
  } else if (sortBy === 'wave') {
    list.sort((a, b) => a.wave - b.wave || a.lane - b.lane);
  }
  return list;
}

export interface PaceDeltaBadge {
  label: string;
  variant: 'fast' | 'slow' | 'neutral';
}

export function getPaceDeltaBadge(netTimeMs: number, targetTimeSec: number): PaceDeltaBadge | null {
  if (!targetTimeSec || targetTimeSec <= 0) return null;
  const targetMs = targetTimeSec * 1000;
  const diffSec = (netTimeMs - targetMs) / 1000;
  const sign = diffSec > 0 ? '+' : '';
  const formattedDiff = `${sign}${diffSec.toFixed(2)}s`;

  if (diffSec <= -0.2) {
    return { label: formattedDiff, variant: 'fast' };
  } else if (diffSec <= 0.8) {
    return { label: formattedDiff, variant: 'neutral' };
  } else {
    return { label: formattedDiff, variant: 'slow' };
  }
}

export function buildResultsClipboardText(results: SwimResult[] = [], setName: string = 'Set'): string {
  const first = results[0];
  const sName = first?.sessionName || setName;
  const sDate = first?.sessionDate || '';
  const sTime = first?.sessionTime || '';
  const dateSub = [sDate, sTime].filter(Boolean).join(' @ ');

  const lines: string[] = [
    `🏊 DeckGala Pro — ${sName}${dateSub ? ` (${dateSub})` : ''}`,
    `Total Swims: ${results.length}`,
    '----------------------------------------'
  ];

  results.slice().reverse().forEach((r, idx) => {
    lines.push(
      `${idx + 1}. [L${r.lane} W${r.wave}] ${r.swimmer} (Rep #${r.rep}) — ${formatMs(r.netTimeMs)}`
    );
  });

  return lines.join('\n');
}

export function buildResultsCsv(results: SwimResult[] = []): string {
  const headers = [
    'Order',
    'Session Name',
    'Session Date',
    'Session Time',
    'Set Name',
    'Lane',
    'Wave',
    'Swimmer',
    'Rep',
    'Net Split',
    'Net Seconds',
    'Target Seconds',
    'Wall Clock Finish',
    'Recorded At'
  ];

  const rows: (string | number)[][] = [headers];
  results.slice().reverse().forEach((r, idx) => {
    rows.push([
      idx + 1,
      csvEscape(r.sessionName || ''),
      csvEscape(r.sessionDate || ''),
      csvEscape(r.sessionTime || ''),
      csvEscape(r.setName),
      r.lane,
      r.wave,
      csvEscape(r.swimmer),
      r.rep,
      formatMs(r.netTimeMs),
      (r.netTimeMs / 1000).toFixed(2),
      r.targetTimeSec || '',
      formatMs(r.finishWallMs),
      csvEscape(r.timestamp)
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}

