import { describe, it, expect, beforeEach } from 'bun:test';
import { formatMs, formatShortSec, sanitizeFilename } from './format';
import { csvEscape, parseCsvLine } from './csv';
import {
  getSwimmerNamesForLane,
  createDefaultLanes,
  getSessionPoolSwimmers,
  getAllAssignedLaneNamesSet,
  distributeSwimmersAcrossLanes
} from './lanes';
import { createDefaultClub } from './defaultClub';
import {
  createInitialStopwatchState,
  launchAllWaveZero,
  processAutoWaveSpawns,
  releaseNextWaveInLane,
  releaseNextWaveInAllLanes,
  recordSwimmerStop,
  recordSwimmerScratch
} from './engine';
import {
  computeResultsKpis,
  filterAndSortResults,
  getPaceDeltaBadge,
  buildResultsClipboardText,
  buildResultsCsv
} from './results';
import {
  filterAndSortSwimmers,
  parseBulkSwimmersText,
  getTotalClubSwimmersCount
} from './roster';
import {
  buildSwimmerExportPayload,
  parseImportFileText,
  applyImportToClub
} from './exporters';
import { loadPersistedState, savePersistedState, getDefaultConfig } from './storage';
import type { SwimResult } from '../types';

describe('format helpers', () => {
  it('formats milliseconds accurately into MM:SS.hh and MM:SS', () => {
    expect(formatMs(0)).toBe('00:00.00');
    expect(formatMs(65432)).toBe('01:05.43');
    expect(formatMs(65432, false)).toBe('01:05');
    expect(formatMs(null)).toBe('--:--');
    expect(formatMs(NaN)).toBe('--:--');
  });

  it('formats short countdown seconds', () => {
    expect(formatShortSec(4200)).toBe('5s');
    expect(formatShortSec(65000)).toBe('1:05');
  });

  it('sanitizes filenames', () => {
    expect(sanitizeFilename('Senior Performance 2025!')).toBe('senior-performance-2025');
    expect(sanitizeFilename('')).toBe('export');
  });
});

describe('csv helpers', () => {
  it('escapes and parses CSV lines with commas and quotes', () => {
    expect(csvEscape('Alex Rivera')).toBe('Alex Rivera');
    expect(csvEscape('Fast, " strong')).toBe('"Fast, "" strong"');

    const line = '"Senior, Gold",Coach Sarah,"Fast ""underwater"" kick",24.10';
    expect(parseCsvLine(line)).toEqual([
      'Senior, Gold',
      'Coach Sarah',
      'Fast "underwater" kick',
      '24.10'
    ]);
  });
});

describe('lanes & squad helpers', () => {
  it('extracts swimmer names from lane config', () => {
    const lane = { lane: 1, interval: 5, swimmersText: ' Alex Rivera \n\n Sam Chen \n' };
    expect(getSwimmerNamesForLane(lane)).toEqual(['Alex Rivera', 'Sam Chen']);
  });

  it('gets session pool swimmers from selected groups', () => {
    const club = createDefaultClub();
    const pool = getSessionPoolSwimmers(club, ['grp-senior-perf']);
    expect(pool.length).toBe(6);
    expect(pool[0].groupName).toBe('Senior Performance');
  });

  it('distributes swimmers round-robin across active lanes', () => {
    const lanes = createDefaultLanes(3);
    const pool = [{ name: 'S1' }, { name: 'S2' }, { name: 'S3' }, { name: 'S4' }, { name: 'S5' }];
    const updated = distributeSwimmersAcrossLanes(lanes, 3, pool);
    expect(getSwimmerNamesForLane(updated[0])).toEqual(['S1', 'S4']);
    expect(getSwimmerNamesForLane(updated[1])).toEqual(['S2', 'S5']);
    expect(getSwimmerNamesForLane(updated[2])).toEqual(['S3']);

    const assignedSet = getAllAssignedLaneNamesSet(updated, 3);
    expect(assignedSet.has('s4')).toBe(true);
    expect(assignedSet.size).toBe(5);
  });
});

describe('stopwatch engine', () => {
  it('launches wave 0 in interval mode and auto-spawns subsequent waves', () => {
    const config = {
      ...getDefaultConfig(),
      laneCount: 2,
      stopwatchMode: 'interval' as const,
      lanes: [
        { lane: 1, interval: 5, swimmersText: 'Swimmer A1\nSwimmer A2\nSwimmer A3' },
        { lane: 2, interval: 10, swimmersText: 'Swimmer B1\nSwimmer B2' }
      ]
    };

    let sw = createInitialStopwatchState(2);
    sw = launchAllWaveZero(sw, config, [], 0);

    expect(sw.lanes[1].activeSwimmers.length).toBe(1);
    expect(sw.lanes[1].activeSwimmers[0].name).toBe('Swimmer A1');
    expect(sw.lanes[1].nextWaveIndex).toBe(1);
    expect(sw.lanes[1].nextWaveTimeMs).toBe(5000);

    const step1 = processAutoWaveSpawns(sw, config, [], 5000);
    sw = step1.stopwatch;
    expect(step1.anyWaveLaunched).toBe(true);
    expect(sw.lanes[1].activeSwimmers.length).toBe(2);
    expect(sw.lanes[1].activeSwimmers[1].name).toBe('Swimmer A2');
    expect(sw.lanes[2].activeSwimmers.length).toBe(1);

    const stopRes = recordSwimmerStop(sw, config, 1, null, 62450);
    sw = stopRes.stopwatch;
    expect(stopRes.result).not.toBeNull();
    expect(stopRes.result!.swimmer).toBe('Swimmer A1');
    expect(stopRes.result!.netTimeMs).toBe(62450);
    expect(sw.lanes[1].activeSwimmers.length).toBe(1);
    expect(sw.undoStack.length).toBe(1);
  });

  it('launches all swimmers simultaneously in mass start mode', () => {
    const config = {
      ...getDefaultConfig(),
      laneCount: 1,
      stopwatchMode: 'mass' as const,
      lanes: [{ lane: 1, interval: 5, swimmersText: 'A\nB\nC' }]
    };

    let sw = createInitialStopwatchState(1);
    sw = launchAllWaveZero(sw, config, [], 0);
    expect(sw.lanes[1].activeSwimmers.length).toBe(3);
    expect(sw.lanes[1].nextWaveTimeMs).toBe(Infinity);
  });

  it('manually releases waves and recycles back to wave 1 when queue completes', () => {
    const config = {
      ...getDefaultConfig(),
      laneCount: 1,
      stopwatchMode: 'manual' as const,
      lanes: [{ lane: 1, interval: 5, swimmersText: 'A\nB' }]
    };

    let sw = createInitialStopwatchState(1);
    sw = launchAllWaveZero(sw, config, [], 0);
    expect(sw.lanes[1].activeSwimmers.map(s => s.name)).toEqual(['A']);

    const rel1 = releaseNextWaveInLane(sw, config, [], 1, 4000);
    sw = rel1.stopwatch;
    expect(rel1.recycled).toBe(false);
    expect(sw.lanes[1].activeSwimmers.map(s => s.name)).toEqual(['A', 'B']);

    const rel2 = releaseNextWaveInLane(sw, config, [], 1, 8000);
    sw = rel2.stopwatch;
    expect(rel2.recycled).toBe(true);
    expect(sw.lanes[1].activeSwimmers.length).toBe(3);
    expect(sw.lanes[1].activeSwimmers[2].name).toBe('A');
    expect(sw.lanes[1].activeSwimmers[2].rep).toBe(2);
  });

  it('releases waves across all active lanes simultaneously in manual push mode', () => {
    const config = {
      ...getDefaultConfig(),
      laneCount: 2,
      stopwatchMode: 'manual' as const,
      lanes: [
        { lane: 1, interval: 5, swimmersText: 'L1-W1\nL1-W2' },
        { lane: 2, interval: 5, swimmersText: 'L2-W1\nL2-W2' }
      ]
    };

    let sw = createInitialStopwatchState(2);
    sw = launchAllWaveZero(sw, config, [], 0);
    expect(sw.lanes[1].activeSwimmers.map(s => s.name)).toEqual(['L1-W1']);
    expect(sw.lanes[2].activeSwimmers.map(s => s.name)).toEqual(['L2-W1']);

    const resAll = releaseNextWaveInAllLanes(sw, config, [], 12000);
    expect(resAll.releasedCount).toBe(2);
    expect(resAll.stopwatch.lanes[1].activeSwimmers.map(s => s.name)).toEqual(['L1-W1', 'L1-W2']);
    expect(resAll.stopwatch.lanes[2].activeSwimmers.map(s => s.name)).toEqual(['L2-W1', 'L2-W2']);
  });

  it('records swimmer scratch and pushes to undo stack', () => {
    const config = {
      ...getDefaultConfig(),
      laneCount: 1,
      lanes: [{ lane: 1, interval: 5, swimmersText: 'A\nB' }]
    };
    let sw = launchAllWaveZero(createInitialStopwatchState(1), config, [], 0);
    const activeId = sw.lanes[1].activeSwimmers[0].id;
    const scratchRes = recordSwimmerScratch(sw, 1, activeId);
    expect(scratchRes.scratched?.name).toBe('A');
    expect(scratchRes.stopwatch.lanes[1].activeSwimmers.length).toBe(0);
    expect(scratchRes.stopwatch.undoStack.length).toBe(1);
  });
});

describe('results calculations and exports', () => {
  const sampleResults: SwimResult[] = [
    {
      id: 'r2',
      timestamp: '10:02:00',
      sessionName: 'Morning Training Session',
      sessionDate: '2026-10-24',
      sessionTime: '06:30',
      setName: '10x100m',
      lane: 2,
      swimmer: 'Taylor Brooks',
      wave: 1,
      rep: 1,
      netTimeMs: 74000,
      finishWallMs: 74000,
      targetTimeSec: 75
    },
    {
      id: 'r1',
      timestamp: '10:01:00',
      sessionName: 'Morning Training Session',
      sessionDate: '2026-10-24',
      sessionTime: '06:30',
      setName: '10x100m',
      lane: 1,
      swimmer: 'Alex Rivera',
      wave: 1,
      rep: 1,
      netTimeMs: 70000,
      finishWallMs: 70000,
      targetTimeSec: 75
    }
  ];

  it('computes KPIs accurately', () => {
    const kpis = computeResultsKpis(sampleResults);
    expect(kpis.totalCount).toBe(2);
    expect(kpis.fastestText).toBe('01:10.00');
    expect(kpis.fastestSub).toBe('Alex Rivera (Lane 1)');
    expect(kpis.avgText).toBe('01:12.00');
    expect(kpis.wavesCount).toBe(1);
  });

  it('computes pace delta badge', () => {
    expect(getPaceDeltaBadge(70000, 75)).toEqual({ label: '-5.00s', variant: 'fast' });
    expect(getPaceDeltaBadge(75500, 75)).toEqual({ label: '+0.50s', variant: 'neutral' });
    expect(getPaceDeltaBadge(78000, 75)).toEqual({ label: '+3.00s', variant: 'slow' });
    expect(getPaceDeltaBadge(70000, 0)).toBeNull();
  });

  it('filters and sorts results', () => {
    const filtered = filterAndSortResults(sampleResults, { laneFilter: '1' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].swimmer).toBe('Alex Rivera');

    const sortedFastest = filterAndSortResults(sampleResults, { sortBy: 'fastest' });
    expect(sortedFastest[0].swimmer).toBe('Alex Rivera');
  });

  it('builds clipboard summary and CSV export', () => {
    const clip = buildResultsClipboardText(sampleResults, 'Morning Training Session');
    expect(clip).toContain('AquaPace Pro — Morning Training Session');
    expect(clip).toContain('Alex Rivera');

    const csv = buildResultsCsv(sampleResults);
    expect(csv).toContain('Session Name,Session Date,Session Time,Set Name');
    expect(csv).toContain('Morning Training Session');
    expect(csv).toContain('Alex Rivera');
  });
});

describe('roster management & import/export', () => {
  it('filters and sorts swimmers by name and age', () => {
    const club = createDefaultClub();
    const seniorSwimmers = club.groups[0].swimmers;

    const filtered = filterAndSortSwimmers(seniorSwimmers, { search: 'Sam' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Sam Chen');

    const byAgeDesc = filterAndSortSwimmers(seniorSwimmers, {
      sort: { field: 'age', dir: 'desc' }
    });
    expect(byAgeDesc[0].name).toBe('Jordan Taylor');
  });

  it('parses bulk swimmers text in both simple and CSV formats', () => {
    const raw = `
      Katie Ledecky, 27, F, 24.80, 53.20, Distance
      Caeleb Dressel
    `;
    const parsed = parseBulkSwimmersText(raw);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Katie Ledecky');
    expect(parsed[0].age).toBe(27);
    expect(parsed[0].gender).toBe('F');
    expect(parsed[0].pb50m).toBe('24.80');
    expect(parsed[1].name).toBe('Caeleb Dressel');
  });

  it('exports and re-imports club and group rosters in JSON and CSV formats', () => {
    const club = createDefaultClub();
    expect(getTotalClubSwimmersCount(club)).toBe(21);

    // Group JSON export -> import into new group
    const groupJsonExport = buildSwimmerExportPayload(club, {
      scope: 'group',
      format: 'json',
      groupId: 'grp-senior-perf'
    });
    expect(groupJsonExport).not.toBeNull();
    const parsedGroupJson = parseImportFileText(groupJsonExport!.content, groupJsonExport!.filename);
    expect(parsedGroupJson.detectedScope).toBe('group');
    expect(parsedGroupJson.totalSwimmers).toBe(6);

    const appliedNewGrp = applyImportToClub(
      club,
      club.groups[0].id,
      ['grp-senior-perf'],
      parsedGroupJson,
      {
        targetScope: 'group',
        clubImportMode: 'merge',
        groupImportTarget: '__new__',
        newGroupName: 'National Squad'
      }
    );
    expect(appliedNewGrp.club.groups.length).toBe(5);
    expect(appliedNewGrp.club.groups[4].name).toBe('National Squad');
    expect(appliedNewGrp.club.groups[4].swimmers.length).toBe(6);

    // Club CSV export -> replace import
    const clubCsvExport = buildSwimmerExportPayload(club, {
      scope: 'club',
      format: 'csv'
    });
    expect(clubCsvExport).not.toBeNull();
    const parsedClubCsv = parseImportFileText(clubCsvExport!.content, clubCsvExport!.filename);
    expect(parsedClubCsv.detectedScope).toBe('club');
    expect(parsedClubCsv.groups.length).toBe(4);
    expect(parsedClubCsv.totalSwimmers).toBe(21);
  });
});

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads persisted state', () => {
    const initial = loadPersistedState();
    expect(initial.club.groups.length).toBe(4);

    initial.config.setName = 'Custom Threshold Set';
    initial.club.clubName = 'Metro Sharks';
    savePersistedState(initial);

    const reloaded = loadPersistedState();
    expect(reloaded.config.setName).toBe('Custom Threshold Set');
    expect(reloaded.club.clubName).toBe('Metro Sharks');
  });
});

