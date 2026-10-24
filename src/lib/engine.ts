import { getSwimmerNamesForLane } from './lanes';
import type { AppConfig, SwimResult, StopwatchRuntime, ActiveSwimmer, UndoStopAction, UndoScratchAction } from '../types';

export function createInitialStopwatchState(laneCount: number = 6): StopwatchRuntime {
  const lanes: StopwatchRuntime['lanes'] = {};
  for (let i = 1; i <= laneCount; i++) {
    lanes[i] = {
      nextWaveIndex: 0,
      nextWaveTimeMs: 0,
      activeSwimmers: []
    };
  }
  return {
    isRunning: false,
    startTimestamp: 0,
    elapsedMs: 0,
    lastTickFloorSec: -1,
    lanes,
    undoStack: []
  };
}

export function syncStopwatchLanes(stopwatch: StopwatchRuntime, laneCount: number): StopwatchRuntime {
  const lanes = { ...stopwatch.lanes };
  for (let i = 1; i <= laneCount; i++) {
    if (!lanes[i]) {
      lanes[i] = {
        nextWaveIndex: 0,
        nextWaveTimeMs: 0,
        activeSwimmers: []
      };
    }
  }
  return { ...stopwatch, lanes };
}

export function getNextRepCountForSwimmer(
  laneNum: number,
  swimmerName: string,
  results: SwimResult[] = [],
  activeSwimmers: ActiveSwimmer[] = [],
  setName: string = ''
): number {
  const completed = results.filter(
    r => r.lane === laneNum && r.swimmer === swimmerName && r.setName === setName
  ).length;
  const currentlySwimming = activeSwimmers.filter(s => s.name === swimmerName).length;
  return completed + currentlySwimming + 1;
}

export function spawnSwimmerInLane(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  results: SwimResult[],
  laneNum: number,
  waveIndex: number,
  startTimeMs: number
): { stopwatch: StopwatchRuntime; spawned: ActiveSwimmer | null } {
  const laneCfg = config.lanes[laneNum - 1];
  const names = getSwimmerNamesForLane(laneCfg);
  const swimmerName = names[waveIndex];
  if (!swimmerName) return { stopwatch, spawned: null };

  const laneRt = stopwatch.lanes[laneNum] || {
    nextWaveIndex: 0,
    nextWaveTimeMs: 0,
    activeSwimmers: []
  };

  const repCount = getNextRepCountForSwimmer(
    laneNum,
    swimmerName,
    results,
    laneRt.activeSwimmers,
    config.setName
  );

  const spawned: ActiveSwimmer = {
    id: `${laneNum}-${waveIndex}-${startTimeMs}-${Math.random().toString(36).slice(2, 6)}`,
    lane: laneNum,
    name: swimmerName,
    wave: waveIndex + 1,
    startTimeMs,
    rep: repCount
  };

  const nextLanes: StopwatchRuntime['lanes'] = {
    ...stopwatch.lanes,
    [laneNum]: {
      ...laneRt,
      activeSwimmers: [...laneRt.activeSwimmers, spawned]
    }
  };

  return {
    stopwatch: { ...stopwatch, lanes: nextLanes },
    spawned
  };
}

export function launchAllWaveZero(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  results: SwimResult[],
  startTimeMs: number = 0
): StopwatchRuntime {
  let nextSw = syncStopwatchLanes(stopwatch, config.laneCount);

  for (let i = 1; i <= config.laneCount; i++) {
    const laneCfg = config.lanes[i - 1];
    const names = getSwimmerNamesForLane(laneCfg);
    if (names.length === 0) continue;

    if (config.stopwatchMode === 'mass') {
      names.forEach((_, idx) => {
        const res = spawnSwimmerInLane(nextSw, config, results, i, idx, startTimeMs);
        nextSw = res.stopwatch;
      });
      nextSw = {
        ...nextSw,
        lanes: {
          ...nextSw.lanes,
          [i]: {
            ...nextSw.lanes[i],
            nextWaveIndex: names.length,
            nextWaveTimeMs: Infinity
          }
        }
      };
    } else {
      const res = spawnSwimmerInLane(nextSw, config, results, i, 0, startTimeMs);
      nextSw = res.stopwatch;
      const intervalMs = (laneCfg.interval || 5) * 1000;
      nextSw = {
        ...nextSw,
        lanes: {
          ...nextSw.lanes,
          [i]: {
            ...nextSw.lanes[i],
            nextWaveIndex: 1,
            nextWaveTimeMs: names.length > 1 ? startTimeMs + intervalMs : Infinity
          }
        }
      };
    }
  }
  return nextSw;
}

export function processAutoWaveSpawns(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  results: SwimResult[],
  nowElapsed: number
): { stopwatch: StopwatchRuntime; anyWaveLaunched: boolean } {
  if (config.stopwatchMode !== 'interval') {
    return { stopwatch, anyWaveLaunched: false };
  }

  let nextSw = stopwatch;
  let anyWaveLaunched = false;

  for (let i = 1; i <= config.laneCount; i++) {
    const laneCfg = config.lanes[i - 1];
    const names = getSwimmerNamesForLane(laneCfg);
    if (names.length === 0) continue;

    const intervalMs = (laneCfg.interval || 5) * 1000;
    let laneRt = nextSw.lanes[i];
    if (!laneRt) continue;

    while (laneRt.nextWaveIndex < names.length && nowElapsed >= laneRt.nextWaveTimeMs) {
      const exactWaveStart = laneRt.nextWaveTimeMs;
      const res = spawnSwimmerInLane(nextSw, config, results, i, laneRt.nextWaveIndex, exactWaveStart);
      nextSw = res.stopwatch;
      const nextIdx = laneRt.nextWaveIndex + 1;
      const nextTime = nextIdx < names.length
        ? (intervalMs > 0 ? exactWaveStart + intervalMs : exactWaveStart)
        : Infinity;

      laneRt = {
        ...nextSw.lanes[i],
        nextWaveIndex: nextIdx,
        nextWaveTimeMs: nextTime
      };
      nextSw = {
        ...nextSw,
        lanes: {
          ...nextSw.lanes,
          [i]: laneRt
        }
      };
      anyWaveLaunched = true;
      if (intervalMs === 0 && laneRt.nextWaveIndex >= names.length) break;
    }
  }

  return { stopwatch: nextSw, anyWaveLaunched };
}

export function releaseNextWaveInLane(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  results: SwimResult[],
  laneNum: number,
  nowElapsed: number
): { stopwatch: StopwatchRuntime; spawned: ActiveSwimmer | null; recycled: boolean } {
  const laneCfg = config.lanes[laneNum - 1];
  const names = getSwimmerNamesForLane(laneCfg);
  if (names.length === 0) return { stopwatch, spawned: null, recycled: false };

  let nextSw = syncStopwatchLanes(stopwatch, config.laneCount);
  let laneRt = nextSw.lanes[laneNum];
  let recycled = false;

  let nextWaveIndex = laneRt.nextWaveIndex;
  if (nextWaveIndex >= names.length) {
    nextWaveIndex = 0;
    recycled = true;
  }

  const res = spawnSwimmerInLane(nextSw, config, results, laneNum, nextWaveIndex, nowElapsed);
  nextSw = res.stopwatch;

  const updatedIdx = nextWaveIndex + 1;
  const intervalMs = (laneCfg.interval || 5) * 1000;
  const nextWaveTimeMs = config.stopwatchMode === 'interval' && updatedIdx < names.length
    ? nowElapsed + intervalMs
    : Infinity;

  nextSw = {
    ...nextSw,
    lanes: {
      ...nextSw.lanes,
      [laneNum]: {
        ...nextSw.lanes[laneNum],
        nextWaveIndex: updatedIdx,
        nextWaveTimeMs
      }
    }
  };

  return { stopwatch: nextSw, spawned: res.spawned, recycled };
}

export function releaseNextWaveInAllLanes(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  results: SwimResult[],
  nowElapsed: number
): { stopwatch: StopwatchRuntime; releasedCount: number; recycledCount: number } {
  let nextSw = stopwatch;
  let releasedCount = 0;
  let recycledCount = 0;

  for (let i = 1; i <= config.laneCount; i++) {
    const res = releaseNextWaveInLane(nextSw, config, results, i, nowElapsed);
    if (res.spawned) {
      nextSw = res.stopwatch;
      releasedCount++;
      if (res.recycled) {
        recycledCount++;
      }
    }
  }

  return { stopwatch: nextSw, releasedCount, recycledCount };
}

export function recordSwimmerStop(
  stopwatch: StopwatchRuntime,
  config: AppConfig,
  laneNum: number,
  swimmerId: string | null = null,
  finishWallMs?: number
): { stopwatch: StopwatchRuntime; result: SwimResult | null } {
  const laneRt = stopwatch.lanes[laneNum];
  if (!laneRt || laneRt.activeSwimmers.length === 0) {
    return { stopwatch, result: null };
  }

  let idx = 0;
  if (swimmerId) {
    const found = laneRt.activeSwimmers.findIndex(s => s.id === swimmerId);
    if (found !== -1) idx = found;
  }

  const swimmerObj = laneRt.activeSwimmers[idx];
  const wallMs = finishWallMs ?? stopwatch.elapsedMs;
  const netTimeMs = Math.max(0, wallMs - swimmerObj.startTimeMs);

  const result: SwimResult = {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    sessionName: config.sessionName || 'Training Session',
    sessionDate: config.sessionDate || new Date().toISOString().slice(0, 10),
    sessionTime: config.sessionTime || new Date().toTimeString().slice(0, 5),
    setName: config.setName || 'Unlabeled Set',
    lane: laneNum,
    swimmer: swimmerObj.name,
    wave: swimmerObj.wave,
    rep: swimmerObj.rep,
    netTimeMs,
    finishWallMs: wallMs,
    targetTimeSec: config.targetTime || 0
  };

  const remaining = laneRt.activeSwimmers.filter((_, i) => i !== idx);
  const undoEntry: UndoStopAction = {
    type: 'stop',
    resultId: result.id,
    swimmerObj,
    lane: laneNum,
    swimmerIndex: idx
  };

  const nextSw: StopwatchRuntime = {
    ...stopwatch,
    lanes: {
      ...stopwatch.lanes,
      [laneNum]: {
        ...laneRt,
        activeSwimmers: remaining
      }
    },
    undoStack: [...stopwatch.undoStack, undoEntry]
  };

  return { stopwatch: nextSw, result };
}

export function recordSwimmerScratch(
  stopwatch: StopwatchRuntime,
  laneNum: number,
  swimmerId: string
): { stopwatch: StopwatchRuntime; scratched: ActiveSwimmer | null } {
  const laneRt = stopwatch.lanes[laneNum];
  if (!laneRt) return { stopwatch, scratched: null };

  const idx = laneRt.activeSwimmers.findIndex(s => s.id === swimmerId);
  if (idx === -1) return { stopwatch, scratched: null };

  const swimmerObj = laneRt.activeSwimmers[idx];
  const remaining = laneRt.activeSwimmers.filter((_, i) => i !== idx);
  const undoEntry: UndoScratchAction = {
    type: 'scratch',
    swimmerObj,
    lane: laneNum,
    swimmerIndex: idx
  };

  const nextSw: StopwatchRuntime = {
    ...stopwatch,
    lanes: {
      ...stopwatch.lanes,
      [laneNum]: {
        ...laneRt,
        activeSwimmers: remaining
      }
    },
    undoStack: [...stopwatch.undoStack, undoEntry]
  };

  return { stopwatch: nextSw, scratched: swimmerObj };
}

