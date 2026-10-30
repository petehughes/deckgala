import { describe, it, expect } from 'bun:test';
import {
  parseTimeToMs,
  formatMsToTime,
  evaluateSwimmerTarget,
  evaluateAllSwimmerTargets,
  getEffectiveSwimmerPBs,
  STANDARD_STROKES,
  STROKE_DISTANCES,
  DEFAULT_ANNUAL_TARGETS
} from './targets';
import type { AnnualTarget, Swimmer, SwimmerPB } from '../types';

describe('Annual Targets & Swimmer PB Utilities', () => {
  describe('parseTimeToMs and formatMsToTime', () => {
    it('correctly parses time strings into milliseconds', () => {
      expect(parseTimeToMs('58.42')).toBe(58420);
      expect(parseTimeToMs('1:02.50')).toBe(62500);
      expect(parseTimeToMs('2:14.05')).toBe(134050);
      expect(parseTimeToMs('15:45.30')).toBe(945300);
      expect(parseTimeToMs('0:59.99')).toBe(59990);
    });

    it('handles seconds without hundredths', () => {
      expect(parseTimeToMs('58')).toBe(58000);
      expect(parseTimeToMs('1:05')).toBe(65000);
    });

    it('returns null for empty or invalid strings', () => {
      expect(parseTimeToMs('')).toBeNull();
      expect(parseTimeToMs('invalid')).toBeNull();
      expect(parseTimeToMs('::')).toBeNull();
    });

    it('formats milliseconds into swimming notation MM:SS.hh', () => {
      expect(formatMsToTime(58420)).toBe('58.42');
      expect(formatMsToTime(62500)).toBe('1:02.50');
      expect(formatMsToTime(62500, false)).toBe('1:02.50');
      expect(formatMsToTime(58420, true)).toBe('0:58.42');
      expect(formatMsToTime(134050)).toBe('2:14.05');
    });
  });

  describe('Standard strokes and distances (100m and above)', () => {
    it('only contains strokes with distances 100m and above', () => {
      STANDARD_STROKES.forEach(stroke => {
        const distances = STROKE_DISTANCES[stroke];
        expect(distances).toBeDefined();
        distances.forEach(d => {
          expect(d).toBeGreaterThanOrEqual(100);
        });
      });

      expect(STROKE_DISTANCES['Freestyle']).toEqual([100, 200, 400, 800, 1500]);
      expect(STROKE_DISTANCES['Backstroke']).toEqual([100, 200]);
      expect(STROKE_DISTANCES['Breaststroke']).toEqual([100, 200]);
      expect(STROKE_DISTANCES['Butterfly']).toEqual([100, 200]);
      expect(STROKE_DISTANCES['Individual Medley']).toEqual([100, 200, 400]);
    });
  });

  describe('evaluateSwimmerTarget', () => {
    const countyTarget100Free: AnnualTarget = {
      id: 'target-county-100free',
      competitionName: 'County Championships 2026',
      level: 'county',
      year: 2026,
      stroke: 'Freestyle',
      distance: 100,
      course: '25m',
      gender: 'Open',
      minAge: 13,
      maxAge: 14,
      qualifyingTime: '1:04.00',
      qualifyingTimeMs: 64000,
      considerationTime: '1:06.00',
      considerationTimeMs: 66000
    };

    it('identifies when a swimmer has achieved qualification (faster than QT)', () => {
      const swimmer: Swimmer = {
        id: 'sw-1',
        name: 'Alex Rivera',
        age: 14,
        gender: 'M',
        pb50m: '',
        pb100m: '',
        notes: '',
        personalBests: [
          {
            id: 'pb-1',
            stroke: 'Freestyle',
            distance: 100,
            course: '25m',
            time: '1:02.50',
            timeMs: 62500
          }
        ]
      };

      const result = evaluateSwimmerTarget(swimmer, countyTarget100Free);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('qualified');
      expect(result?.deltaMs).toBe(-1500); // 1.5s faster than target
      expect(result?.deltaSec).toBe(-1.5);
      expect(result?.swimmerTime).toBe('1:02.50');
      expect(result?.gapSec).toBe('-1.50');
    });

    it('identifies when a swimmer is CLOSE to qualifying (within 2% or 1.5s or within consideration time)', () => {
      const swimmer: Swimmer = {
        id: 'sw-2',
        name: 'Jordan Taylor',
        age: 14,
        gender: 'F',
        pb50m: '',
        pb100m: '',
        notes: '',
        personalBests: [
          {
            id: 'pb-2',
            stroke: 'Freestyle',
            distance: 100,
            course: '25m',
            time: '1:04.60',
            timeMs: 64600 // +0.60s away from 1:04.00 (<1.5s and within CT 1:06.00)
          }
        ]
      };

      const result = evaluateSwimmerTarget(swimmer, countyTarget100Free);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('close');
      expect(result?.deltaMs).toBe(600);
      expect(result?.deltaSec).toBe(0.6);
      expect(result?.gapSec).toBe('+0.60');
    });

    it('identifies when a swimmer is developing towards target (>2% and >1.5s away)', () => {
      const swimmer: Swimmer = {
        id: 'sw-3',
        name: 'New Swimmer',
        age: 14,
        gender: 'X',
        pb50m: '',
        pb100m: '',
        notes: '',
        personalBests: [
          {
            id: 'pb-3',
            stroke: 'Freestyle',
            distance: 100,
            course: '25m',
            time: '1:12.00',
            timeMs: 72000 // 8s away
          }
        ]
      };

      const result = evaluateSwimmerTarget(swimmer, countyTarget100Free);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('developing');
      expect(result?.deltaMs).toBe(8000);
      expect(result?.gapSec).toBe('+8.00');
    });

    it('returns status no_time when swimmer has no PB for the event', () => {
      const swimmer: Swimmer = {
        id: 'sw-4',
        name: 'Breaststroke Specialist',
        age: 14,
        gender: 'F',
        pb50m: '',
        pb100m: '',
        notes: '',
        personalBests: [
          {
            id: 'pb-4',
            stroke: 'Breaststroke',
            distance: 100,
            course: '25m',
            time: '1:18.00',
            timeMs: 78000
          }
        ]
      };

      const result = evaluateSwimmerTarget(swimmer, countyTarget100Free);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('no_time');
      expect(result?.deltaMs).toBeNull();
    });

    it('filters out swimmers who do not match target age or gender brackets', () => {
      const swimmerWrongAge: Swimmer = {
        id: 'sw-5',
        name: 'Senior Swimmer',
        age: 17, // Target is 13-14
        gender: 'F',
        pb50m: '',
        pb100m: '',
        notes: ''
      };

      const result = evaluateSwimmerTarget(swimmerWrongAge, countyTarget100Free);
      expect(result).toBeNull();
    });

    it('falls back to legacy pb100m if personalBests array is not yet present', () => {
      const swimmerLegacy: Swimmer = {
        id: 'sw-legacy',
        name: 'Legacy Swimmer',
        age: 14,
        gender: 'X',
        pb50m: '',
        notes: '',
        pb100m: '1:03.50'
      };

      const result = evaluateSwimmerTarget(swimmerLegacy, countyTarget100Free);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('qualified');
      expect(result?.swimmerTime).toBe('1:03.50');
    });
  });

  describe('evaluateAllSwimmerTargets', () => {
    it('evaluates all applicable targets and organizes by level', () => {
      const swimmer: Swimmer = {
        id: 'sw-top',
        name: 'Top Competitor',
        age: 15,
        gender: 'M',
        pb50m: '',
        pb100m: '',
        notes: '',
        personalBests: [
          {
            id: 'pb-1',
            stroke: 'Freestyle',
            distance: 100,
            course: '25m',
            time: '56.50',
            timeMs: 56500
          },
          {
            id: 'pb-2',
            stroke: 'Freestyle',
            distance: 200,
            course: '25m',
            time: '2:04.00',
            timeMs: 124000
          }
        ]
      };

      const grouped = evaluateAllSwimmerTargets(swimmer, DEFAULT_ANNUAL_TARGETS);
      expect(grouped.evaluations.length).toBeGreaterThan(0);
      expect(grouped.totalQualified).toBeGreaterThanOrEqual(1);
    });
  });
});

