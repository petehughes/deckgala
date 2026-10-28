import type { SwimSetItem, WeeklySessionPlan } from '../types';

export interface WeekInfo {
  year: number;
  week: number;
  weekKey: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string; // "Week 44 (26 Oct – 01 Nov)"
  shortLabel: string; // "W44"
  isCurrent: boolean;
}

/**
 * Returns ISO week number, ISO week-numbering year, and formatted week key (e.g. "2026-W44")
 */
export function getISOWeek(dateInput: Date | string = new Date()): { year: number; week: number; weekKey: string } {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput.slice(0, 10)}T12:00:00Z`) : new Date(dateInput.getTime());
  
  // ISO-8601 week starts on Monday, so day 1 = Mon ... 7 = Sun
  const day = (date.getDay() + 6) % 7;
  
  // Set date to the nearest Thursday: current date + 3 - current day number
  date.setDate(date.getDate() - day + 3);
  
  // January 4th is always in week 1 of the ISO year
  const firstThursday = date.getTime();
  date.setMonth(0, 1);
  if (date.getDay() !== 4) {
    date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
  }
  
  const weekNumber = 1 + Math.ceil((firstThursday - date.getTime()) / 604800000);
  const isoYear = new Date(firstThursday).getFullYear();
  const weekStr = weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`;
  
  return {
    year: isoYear,
    week: weekNumber,
    weekKey: `${isoYear}-W${weekStr}`
  };
}

/**
 * Gets the Monday and Sunday dates for a given ISO year and week
 */
export function getWeekDateRange(year: number, week: number): { startDate: string; endDate: string; startObj: Date; endObj: Date } {
  // Simple algorithm: Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // 0 = Mon, 6 = Sun
  
  // Monday of week 1
  const monWeek1 = new Date(jan4.getTime() - jan4Day * 86400000);
  
  // Monday of target week
  const monTarget = new Date(monWeek1.getTime() + (week - 1) * 7 * 86400000);
  const sunTarget = new Date(monTarget.getTime() + 6 * 86400000);
  
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    startDate: fmt(monTarget),
    endDate: fmt(sunTarget),
    startObj: monTarget,
    endObj: sunTarget
  };
}

/**
 * Returns formatted label for a week, e.g. "Week 44 (26 Oct – 01 Nov)"
 */
export function formatWeekLabel(year: number, week: number): string {
  const { startObj, endObj } = getWeekDateRange(year, week);
  const startFmt = startObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const endFmt = endObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `Week ${week} (${startFmt} – ${endFmt})`;
}

/**
 * Generates an array of surrounding weeks for easy carousel/pill scrolling
 */
export function getSurroundingWeeks(
  referenceDate: Date | string = new Date(),
  countBefore = 2,
  countAfter = 8
): WeekInfo[] {
  const current = getISOWeek(referenceDate);
  const currentRef = typeof referenceDate === 'string' ? new Date(`${referenceDate}T12:00:00Z`) : referenceDate;
  const currentIso = getISOWeek(currentRef);

  const results: WeekInfo[] = [];

  // Compute base Monday
  const { startObj: baseMonday } = getWeekDateRange(current.year, current.week);

  for (let offset = -countBefore; offset <= countAfter; offset++) {
    const targetMonday = new Date(baseMonday.getTime() + offset * 7 * 86400000);
    const info = getISOWeek(targetMonday);
    const range = getWeekDateRange(info.year, info.week);
    const label = formatWeekLabel(info.year, info.week);
    
    results.push({
      year: info.year,
      week: info.week,
      weekKey: info.weekKey,
      startDate: range.startDate,
      endDate: range.endDate,
      label,
      shortLabel: `W${info.week}`,
      isCurrent: info.weekKey === currentIso.weekKey
    });
  }

  return results;
}

/**
 * Calculates distance of a single set item: reps * distance
 */
export function calculateSetDistance(item: SwimSetItem): number {
  const reps = Math.max(1, Number(item.reps) || 1);
  const dist = Math.max(0, Number(item.distance) || 0);
  return reps * dist;
}

/**
 * Calculates total volume in meters/yards of a set list
 */
export function calculateTotalDistance(setList: SwimSetItem[] = []): number {
  return setList.reduce((acc, item) => acc + calculateSetDistance(item), 0);
}

/**
 * Formats a swim set item into standard poolside notation
 * e.g. "10 x 100m Free @ 1:30 (Threshold) - descending 1-4"
 */
export function formatSetItem(item: SwimSetItem): string {
  if (item.customLabel && !item.distance) {
    return item.customLabel;
  }
  const reps = item.reps || 1;
  const dist = item.distance || 50;
  const stroke = item.stroke || 'Free';
  let str = `${reps} x ${dist}m ${stroke}`;
  if (item.interval) {
    str += ` ${item.interval}`;
  }
  if (item.intensity && item.intensity !== 'aerobic') {
    const intensityMap: Record<string, string> = {
      warmup: 'Warm-up',
      threshold: 'Threshold',
      lactate: 'Lactate Pace',
      sprint: 'Max Sprint',
      recovery: 'Recovery'
    };
    str += ` [${intensityMap[item.intensity] || item.intensity}]`;
  }
  if (item.description) {
    str += ` · ${item.description}`;
  }
  return str;
}

/**
 * Quick templates for one-tap set addition
 */
export const SET_TEMPLATES: { label: string; item: Omit<SwimSetItem, 'id'> }[] = [
  {
    label: '+ Warm-Up (400m Choice)',
    item: { reps: 1, distance: 400, stroke: 'Choice', interval: 'Easy', intensity: 'warmup', description: 'Swim / Kick / Pull mix' }
  },
  {
    label: '+ 8 x 50m Kick Build',
    item: { reps: 8, distance: 50, stroke: 'Kick', interval: '@ 1:15', intensity: 'aerobic', description: 'Build speed to breakout 15m' }
  },
  {
    label: '+ 10 x 100m Free Pace',
    item: { reps: 10, distance: 100, stroke: 'Free', interval: '@ 1:30', intensity: 'threshold', description: 'Holding target race pace' }
  },
  {
    label: '+ 6 x 200m Threshold',
    item: { reps: 6, distance: 200, stroke: 'Free', interval: '@ 2:45', intensity: 'threshold', description: 'Consistent stroke rate, tight turns' }
  },
  {
    label: '+ 16 x 25m Sprint Breakout',
    item: { reps: 16, distance: 25, stroke: 'Choice', interval: '@ 0:45', intensity: 'sprint', description: 'Max sprint from push, dolphin kicks' }
  },
  {
    label: '+ 4 x 100m IM Order',
    item: { reps: 4, distance: 100, stroke: 'IM', interval: '@ 1:45', intensity: 'aerobic', description: 'Fly / Back / Breast / Free by 25m' }
  },
  {
    label: '+ Cool-Down (200m Easy)',
    item: { reps: 1, distance: 200, stroke: 'Choice', interval: 'Easy', intensity: 'recovery', description: 'Flush out lactate, long glides' }
  }
];

/**
 * Fast parser for multi-line pasted sets
 * e.g. "10 x 100 Free @ 1:30"
 */
export function parseSetTextLine(line: string): SwimSetItem {
  const id = `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const clean = line.trim();
  if (!clean) {
    return { id, reps: 1, distance: 100, stroke: 'Choice' };
  }

  // Regex to match "10 x 100m Free @ 1:30" or "8x50 Kick"
  const match = clean.match(/^(\d+)\s*[xX*]\s*(\d+)(?:m|y)?\s*([a-zA-Z\s]+)?(?:@|r:)?\s*([0-9:]+)?/);
  if (match) {
    const reps = parseInt(match[1], 10) || 1;
    const distance = parseInt(match[2], 10) || 100;
    const strokeRaw = (match[3] || 'Free').trim();
    const intervalRaw = match[4] ? `@ ${match[4].trim()}` : '';
    
    return {
      id,
      reps,
      distance,
      stroke: strokeRaw || 'Free',
      interval: intervalRaw,
      description: clean
    };
  }

  return {
    id,
    reps: 1,
    distance: 100,
    stroke: 'Choice',
    customLabel: clean,
    description: clean
  };
}

/**
 * Clones a weekly plan to a target week key with freshly generated IDs
 */
export function cloneWeeklyPlan(source: WeeklySessionPlan, targetWeekKey: string): WeeklySessionPlan {
  const parts = targetWeekKey.split('-W');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const weekNumber = parseInt(parts[1], 10) || 1;

  return {
    id: `wplan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    year,
    weekNumber,
    weekKey: targetWeekKey,
    briefing: source.briefing,
    targetFocus: source.targetFocus,
    expectedIntensity: source.expectedIntensity,
    notes: source.notes,
    setList: source.setList.map(item => ({
      ...item,
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    }))
  };
}

