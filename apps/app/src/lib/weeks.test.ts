import { describe, it, expect } from 'bun:test';
import {
  getISOWeek,
  getWeekDateRange,
  formatWeekLabel,
  getSurroundingWeeks,
  calculateSetDistance,
  calculateTotalDistance,
  formatSetItem,
  parseSetTextLine,
  cloneWeeklyPlan,
  SET_TEMPLATES
} from './weeks';
import type { SwimSetItem, WeeklySessionPlan } from '../types';

describe('ISO Weeks and Set List Utilities', () => {
  it('correctly calculates ISO week for a known date', () => {
    // 2026-10-27 is a Tuesday in Week 44 of 2026
    const res = getISOWeek('2026-10-27');
    expect(res.year).toBe(2026);
    expect(res.week).toBe(44);
    expect(res.weekKey).toBe('2026-W44');
  });

  it('correctly calculates date ranges for an ISO week', () => {
    const range = getWeekDateRange(2026, 44);
    expect(range.startDate).toBe('2026-10-26'); // Monday
    expect(range.endDate).toBe('2026-11-01'); // Sunday
  });

  it('formats week label nicely', () => {
    const label = formatWeekLabel(2026, 44);
    expect(label).toContain('Week 44');
    expect(label).toContain('Oct');
    expect(label).toContain('Nov');
  });

  it('generates surrounding weeks including the current week flag', () => {
    const weeks = getSurroundingWeeks('2026-10-27', 2, 4);
    expect(weeks.length).toBe(7); // -2 to +4 is 7 weeks
    const current = weeks.find(w => w.weekKey === '2026-W44');
    expect(current).toBeDefined();
    expect(current?.isCurrent).toBe(true);
  });

  it('calculates set distance and total volume', () => {
    const set1: SwimSetItem = { id: 's1', reps: 10, distance: 100, stroke: 'Free' };
    const set2: SwimSetItem = { id: 's2', reps: 8, distance: 50, stroke: 'Kick' };
    const set3: SwimSetItem = { id: 's3', reps: 1, distance: 400, stroke: 'Choice' };

    expect(calculateSetDistance(set1)).toBe(1000);
    expect(calculateSetDistance(set2)).toBe(400);
    expect(calculateSetDistance(set3)).toBe(400);

    const total = calculateTotalDistance([set1, set2, set3]);
    expect(total).toBe(1800);
  });

  it('formats swim set items into standard poolside notation', () => {
    const item: SwimSetItem = {
      id: 's1',
      reps: 10,
      distance: 100,
      stroke: 'Free',
      interval: '@ 1:30',
      intensity: 'threshold',
      description: 'holding descending pace'
    };
    const formatted = formatSetItem(item);
    expect(formatted).toContain('10 x 100m Free @ 1:30');
    expect(formatted).toContain('[Threshold]');
    expect(formatted).toContain('holding descending pace');
  });

  it('parses text line into a structured swim set item', () => {
    const parsed = parseSetTextLine('8 x 50m Kick @ 1:15');
    expect(parsed.reps).toBe(8);
    expect(parsed.distance).toBe(50);
    expect(parsed.stroke.toLowerCase()).toContain('kick');
    expect(parsed.interval).toBe('@ 1:15');
  });

  it('clones a weekly session plan with new IDs and target week key', () => {
    const original: WeeklySessionPlan = {
      id: 'plan-orig',
      weekNumber: 43,
      year: 2026,
      weekKey: '2026-W43',
      briefing: 'Aerobic base focus',
      targetFocus: 'Base Aerobic',
      expectedIntensity: 'high',
      setList: [
        { id: 'set-orig-1', reps: 10, distance: 100, stroke: 'Free', interval: '@ 1:30' }
      ]
    };

    const cloned = cloneWeeklyPlan(original, '2026-W44');
    expect(cloned.weekKey).toBe('2026-W44');
    expect(cloned.weekNumber).toBe(44);
    expect(cloned.briefing).toBe('Aerobic base focus');
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.setList.length).toBe(1);
    expect(cloned.setList[0].id).not.toBe(original.setList[0].id);
    expect(cloned.setList[0].distance).toBe(100);
  });

  it('provides rich set presets', () => {
    expect(SET_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    const warmup = SET_TEMPLATES.find(t => t.label.includes('Warm-Up'));
    expect(warmup).toBeDefined();
    expect(warmup?.item.intensity).toBe('warmup');
  });
});

