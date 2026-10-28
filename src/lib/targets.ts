import type { AnnualTarget, PoolCourse, Swimmer, SwimmerPB, SwimStroke, TargetCompetitionLevel } from '../types';

export const STANDARD_STROKES: SwimStroke[] = [
  'Freestyle',
  'Backstroke',
  'Breaststroke',
  'Butterfly',
  'Individual Medley'
];

export const STROKE_DISTANCES: Record<SwimStroke, number[]> = {
  Freestyle: [100, 200, 400, 800, 1500],
  Backstroke: [100, 200],
  Breaststroke: [100, 200],
  Butterfly: [100, 200],
  'Individual Medley': [100, 200, 400]
};

export const COMPETITION_LEVELS: { id: TargetCompetitionLevel; label: string; badgeClass: string }[] = [
  { id: 'county', label: 'County Championships', badgeClass: 'level-county' },
  { id: 'regional', label: 'Regional Championships', badgeClass: 'level-regional' },
  { id: 'national', label: 'National Championships', badgeClass: 'level-national' },
  { id: 'club', label: 'Club Benchmark', badgeClass: 'level-club' }
];

/**
 * Parses swim time string into milliseconds.
 * Supports: "58.42", "0:58.42", "1:02.50", "01:02.50", "4:15.20", "16:32.40"
 */
export function parseTimeToMs(str: string | null | undefined): number | null {
  if (!str) return null;
  const clean = str.trim();
  if (!clean || clean === '—' || clean === '-') return null;

  // Check for colon: M:SS.hh or MM:SS.hh or MM:SS
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const mins = parseInt(parts[0], 10);
    if (isNaN(mins)) return null;

    let secPart = parts[1];
    let secs = 0;
    let hundredths = 0;

    if (secPart.includes('.')) {
      const sParts = secPart.split('.');
      secs = parseInt(sParts[0], 10);
      hundredths = parseInt((sParts[1] + '00').slice(0, 2), 10);
    } else {
      secs = parseInt(secPart, 10);
    }

    if (isNaN(secs)) return null;
    return mins * 60000 + secs * 1000 + hundredths * 10;
  }

  // Pure seconds: "58.42" or "28.10" or "75"
  if (clean.includes('.')) {
    const sParts = clean.split('.');
    const secs = parseInt(sParts[0], 10);
    const hundredths = parseInt((sParts[1] + '00').slice(0, 2), 10);
    if (isNaN(secs)) return null;
    return secs * 1000 + hundredths * 10;
  }

  const secsOnly = parseFloat(clean);
  if (isNaN(secsOnly)) return null;
  return Math.round(secsOnly * 1000);
}

/**
 * Formats milliseconds into standard swim notation
 * e.g. 58420 -> "58.42", 62500 -> "1:02.50", 255200 -> "4:15.20"
 */
export function formatMsToTime(ms: number | null | undefined, forceMinutes: boolean = false): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms <= 0) return '—';

  const totalHundredths = Math.round(ms / 10);
  const hundredths = totalHundredths % 100;
  const totalSeconds = Math.floor(totalHundredths / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const secStr = minutes > 0 || forceMinutes ? String(seconds).padStart(2, '0') : String(seconds);
  const hunStr = String(hundredths).padStart(2, '0');

  if (minutes > 0 || forceMinutes) {
    return `${minutes}:${secStr}.${hunStr}`;
  }
  return `${secStr}.${hunStr}`;
}

/**
 * Returns all PBs for a swimmer, falling back to legacy pb50m/pb100m if needed.
 */
export function getEffectiveSwimmerPBs(swimmer: Swimmer): SwimmerPB[] {
  const pbs: SwimmerPB[] = swimmer.personalBests ? [...swimmer.personalBests] : [];

  // Check if Freestyle 100m exists in personalBests
  const hasFree100 = pbs.some(p => p.stroke === 'Freestyle' && p.distance === 100);
  if (!hasFree100 && swimmer.pb100m) {
    const ms = parseTimeToMs(swimmer.pb100m);
    if (ms !== null && ms > 0) {
      pbs.unshift({
        id: `legacy-pb100-${swimmer.id}`,
        stroke: 'Freestyle',
        distance: 100,
        course: '25m',
        time: swimmer.pb100m,
        timeMs: ms
      });
    }
  }

  return pbs;
}

export interface SwimmerTargetEvaluation {
  target: AnnualTarget;
  pb: SwimmerPB | null;
  status: 'qualified' | 'close' | 'developing' | 'no_time';
  deltaMs: number | null; // negative means faster than target
  deltaSec: number | null;
  deltaFormatted: string;
  percentToTarget: number | null;
  gapText: string;
  swimmerTime?: string;
  gapSec?: string;
}

/**
 * Evaluates a swimmer against a specific target qualification time.
 */
export function evaluateSwimmerTarget(
  swimmer: Swimmer,
  target: AnnualTarget,
  effectivePBs?: SwimmerPB[]
): SwimmerTargetEvaluation | null {
  // 1. Check gender applicability
  const targetGen = (target.gender || '').toLowerCase();
  const swimmerGen = (swimmer.gender || '').toLowerCase();
  if (targetGen && targetGen !== 'open' && targetGen !== 'x' && swimmerGen) {
    const isTargetFemale = targetGen === 'f' || targetGen === 'female';
    const isSwimmerFemale = swimmerGen === 'f' || swimmerGen === 'female';
    const isTargetMale = targetGen === 'm' || targetGen === 'male';
    const isSwimmerMale = swimmerGen === 'm' || swimmerGen === 'male';

    if (isTargetFemale && !isSwimmerFemale && swimmerGen !== 'x' && swimmerGen !== 'open') {
      return null;
    }
    if (isTargetMale && !isSwimmerMale && swimmerGen !== 'x' && swimmerGen !== 'open') {
      return null;
    }
  }

  // 2. Check age applicability
  if (typeof swimmer.age === 'number' && swimmer.age > 0) {
    if (target.minAge !== undefined && swimmer.age < target.minAge) return null;
    if (target.maxAge !== undefined && swimmer.age > target.maxAge) return null;
  }

  // 3. Find matching PB
  const pbs = effectivePBs || getEffectiveSwimmerPBs(swimmer);
  // Match stroke, distance and optionally course
  const match =
    pbs.find(p => p.stroke === target.stroke && p.distance === target.distance && p.course === target.course) ||
    pbs.find(p => p.stroke === target.stroke && p.distance === target.distance);

  if (!match || !match.timeMs) {
    return {
      target,
      pb: null,
      status: 'no_time',
      deltaMs: null,
      deltaSec: null,
      deltaFormatted: 'No Time',
      percentToTarget: null,
      gapText: 'No PB recorded yet',
      swimmerTime: undefined,
      gapSec: undefined
    };
  }

  const deltaMs = match.timeMs - target.qualifyingTimeMs;
  const deltaSec = deltaMs / 1000;
  const percentToTarget = (target.qualifyingTimeMs / match.timeMs) * 100;

  if (deltaMs <= 0) {
    // Faster or equal to qualifying time -> QUALIFIED!
    const diffAbs = Math.abs(deltaSec).toFixed(2);
    return {
      target,
      pb: match,
      status: 'qualified',
      deltaMs,
      deltaSec,
      deltaFormatted: `-${diffAbs}s`,
      percentToTarget: Math.round(percentToTarget * 10) / 10,
      gapText: `Qualified! (-${diffAbs}s under target)`,
      swimmerTime: match.time,
      gapSec: `-${diffAbs}`
    };
  }

  // Check if close: within 2.0% or within 1.5 seconds or within consideration time
  const percentGap = deltaMs / target.qualifyingTimeMs;
  const isWithinConsideration = Boolean(
    target.considerationTimeMs && match.timeMs <= target.considerationTimeMs
  );
  const isClose = percentGap <= 0.02 || deltaMs <= 1500 || isWithinConsideration;

  const diffStr = deltaSec.toFixed(2);
  if (isClose) {
    return {
      target,
      pb: match,
      status: 'close',
      deltaMs,
      deltaSec,
      deltaFormatted: `+${diffStr}s`,
      percentToTarget: Math.round(percentToTarget * 10) / 10,
      gapText: `Close! Only ${diffStr}s away (${(percentToTarget).toFixed(1)}% to target)`,
      swimmerTime: match.time,
      gapSec: `+${diffStr}`
    };
  }

  return {
    target,
    pb: match,
    status: 'developing',
    deltaMs,
    deltaSec,
    deltaFormatted: `+${diffStr}s`,
    percentToTarget: Math.round(percentToTarget * 10) / 10,
    gapText: `+${diffStr}s to qualifying standard`,
    swimmerTime: match.time,
    gapSec: `+${diffStr}`
  };
}

export interface SwimmerAnnualTargetsSummary {
  evaluations: SwimmerTargetEvaluation[];
  qualified: SwimmerTargetEvaluation[];
  close: SwimmerTargetEvaluation[];
  developing: SwimmerTargetEvaluation[];
  noTime: SwimmerTargetEvaluation[];
  totalQualified: number;
  totalClose: number;
  byLevel: Record<
    TargetCompetitionLevel,
    {
      qualified: SwimmerTargetEvaluation[];
      close: SwimmerTargetEvaluation[];
    }
  >;
}

/**
 * Evaluates all annual targets for a swimmer and groups them by level.
 */
export function evaluateAllSwimmerTargets(
  swimmer: Swimmer,
  targets: AnnualTarget[] = []
): SwimmerAnnualTargetsSummary {
  const pbs = getEffectiveSwimmerPBs(swimmer);
  const evaluations: SwimmerTargetEvaluation[] = [];
  const summary: SwimmerAnnualTargetsSummary = {
    evaluations: [],
    qualified: [],
    close: [],
    developing: [],
    noTime: [],
    totalQualified: 0,
    totalClose: 0,
    byLevel: {
      county: { qualified: [], close: [] },
      regional: { qualified: [], close: [] },
      national: { qualified: [], close: [] },
      club: { qualified: [], close: [] }
    }
  };

  targets.forEach(target => {
    const evalResult = evaluateSwimmerTarget(swimmer, target, pbs);
    if (!evalResult) return; // not applicable for this swimmer age/gender

    evaluations.push(evalResult);

    if (evalResult.status === 'qualified') {
      summary.qualified.push(evalResult);
      summary.byLevel[target.level]?.qualified.push(evalResult);
    } else if (evalResult.status === 'close') {
      summary.close.push(evalResult);
      summary.byLevel[target.level]?.close.push(evalResult);
    } else if (evalResult.status === 'developing') {
      summary.developing.push(evalResult);
    } else if (evalResult.status === 'no_time') {
      summary.noTime.push(evalResult);
    }
  });

  summary.evaluations = evaluations;
  summary.totalQualified = summary.qualified.length;
  summary.totalClose = summary.close.length;

  return summary;
}

/**
 * Standard realistic Annual Targets for Major Competitions (County, Regional, National)
 */
export const DEFAULT_ANNUAL_TARGETS: AnnualTarget[] = [
  // County Championships 2026 (Short Course 25m)
  {
    id: 'target-cqt-m-100free-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '57.50',
    qualifyingTimeMs: 57500,
    considerationTime: '59.00',
    considerationTimeMs: 59000,
    notes: 'County Championship Automatic Qualifying Time'
  },
  {
    id: 'target-cqt-m-200free-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 200,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '2:06.00',
    qualifyingTimeMs: 126000,
    considerationTime: '2:09.50',
    considerationTimeMs: 129500
  },
  {
    id: 'target-cqt-m-400free-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 400,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '4:28.00',
    qualifyingTimeMs: 268000
  },
  {
    id: 'target-cqt-m-100back-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Backstroke',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:06.50',
    qualifyingTimeMs: 66500
  },
  {
    id: 'target-cqt-m-100breast-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Breaststroke',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:15.00',
    qualifyingTimeMs: 75000
  },
  {
    id: 'target-cqt-m-200im-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Individual Medley',
    distance: 200,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '2:24.00',
    qualifyingTimeMs: 144000
  },

  // County Championships 2026 - Female 15-16
  {
    id: 'target-cqt-f-100free-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:02.50',
    qualifyingTimeMs: 62500,
    considerationTime: '1:04.20',
    considerationTimeMs: 64200
  },
  {
    id: 'target-cqt-f-200free-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 200,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '2:16.00',
    qualifyingTimeMs: 136000
  },
  {
    id: 'target-cqt-f-100back-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Backstroke',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:10.50',
    qualifyingTimeMs: 70500
  },
  {
    id: 'target-cqt-f-100fly-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Butterfly',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:10.00',
    qualifyingTimeMs: 70000
  },
  {
    id: 'target-cqt-f-200im-1516',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Individual Medley',
    distance: 200,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '2:34.00',
    qualifyingTimeMs: 154000
  },

  // Senior / Open County Times (Ages 17+)
  {
    id: 'target-cqt-m-100free-17plus',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '54.50',
    qualifyingTimeMs: 54500
  },
  {
    id: 'target-cqt-m-200free-17plus',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 200,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '1:59.00',
    qualifyingTimeMs: 119000
  },
  {
    id: 'target-cqt-f-100free-17plus',
    competitionName: 'County Championships 2026',
    level: 'county',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 17,
    qualifyingTime: '59.80',
    qualifyingTimeMs: 59800
  },

  // Regional Championships 2026 (Short & Long Course)
  {
    id: 'target-rqt-m-100free-17plus',
    competitionName: 'Regional Championships 2026',
    level: 'regional',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '52.80',
    qualifyingTimeMs: 52800,
    considerationTime: '53.80',
    considerationTimeMs: 53800
  },
  {
    id: 'target-rqt-m-200free-17plus',
    competitionName: 'Regional Championships 2026',
    level: 'regional',
    year: 2026,
    stroke: 'Freestyle',
    distance: 200,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '1:56.50',
    qualifyingTimeMs: 116500
  },
  {
    id: 'target-rqt-f-100free-17plus',
    competitionName: 'Regional Championships 2026',
    level: 'regional',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 17,
    qualifyingTime: '58.00',
    qualifyingTimeMs: 58000
  },
  {
    id: 'target-rqt-m-100free-1516',
    competitionName: 'Regional Championships 2026',
    level: 'regional',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '55.20',
    qualifyingTimeMs: 55200
  },
  {
    id: 'target-rqt-f-100free-1516',
    competitionName: 'Regional Championships 2026',
    level: 'regional',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 15,
    maxAge: 16,
    qualifyingTime: '1:00.50',
    qualifyingTimeMs: 60500
  },

  // National Championships 2026
  {
    id: 'target-nqt-m-100free-17plus',
    competitionName: 'National Championships 2026',
    level: 'national',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '51.20',
    qualifyingTimeMs: 51200
  },
  {
    id: 'target-nqt-f-100free-17plus',
    competitionName: 'National Championships 2026',
    level: 'national',
    year: 2026,
    stroke: 'Freestyle',
    distance: 100,
    course: '25m',
    gender: 'F',
    minAge: 17,
    qualifyingTime: '56.40',
    qualifyingTimeMs: 56400
  },
  {
    id: 'target-nqt-m-200free-17plus',
    competitionName: 'National Championships 2026',
    level: 'national',
    year: 2026,
    stroke: 'Freestyle',
    distance: 200,
    course: '25m',
    gender: 'M',
    minAge: 17,
    qualifyingTime: '1:52.50',
    qualifyingTimeMs: 112500
  }
];
