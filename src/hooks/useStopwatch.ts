import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialStopwatchState,
  syncStopwatchLanes,
  launchAllWaveZero,
  processAutoWaveSpawns,
  releaseNextWaveInLane,
  releaseNextWaveInAllLanes,
  recordSwimmerStop,
  recordSwimmerScratch
} from '../lib/engine';
import { getSwimmerNamesForLane } from '../lib/lanes';
import { playBeep } from '../lib/audio';
import type { AppConfig, SwimResult, StopwatchRuntime, ToastItem } from '../types';

interface UseStopwatchParams {
  config: AppConfig;
  results: SwimResult[];
  setResults: (updater: SwimResult[] | ((prev: SwimResult[]) => SwimResult[])) => void;
  showToast: (message: string, type?: ToastItem['type']) => void;
}

export function useStopwatch({ config, results, setResults, showToast }: UseStopwatchParams) {
  const [stopwatch, setStopwatch] = useState<StopwatchRuntime>(() =>
    createInitialStopwatchState(config.laneCount)
  );
  const [displayElapsedMs, setDisplayElapsedMs] = useState<number>(0);

  const stopwatchRef = useRef<StopwatchRuntime>(stopwatch);
  stopwatchRef.current = stopwatch;

  const configRef = useRef<AppConfig>(config);
  configRef.current = config;

  const resultsRef = useRef<SwimResult[]>(results);
  resultsRef.current = results;

  useEffect(() => {
    setStopwatch(prev => syncStopwatchLanes(prev, config.laneCount));
  }, [config.laneCount]);

  useEffect(() => {
    if (!stopwatch.isRunning) return;

    const intervalId = setInterval(() => {
      const sw = stopwatchRef.current;
      if (!sw.isRunning) return;

      const nowElapsed = performance.now() - sw.startTimestamp;
      setDisplayElapsedMs(nowElapsed);

      const cfg = configRef.current;
      const res = resultsRef.current;

      const { stopwatch: afterWaves, anyWaveLaunched } = processAutoWaveSpawns(
        sw,
        cfg,
        res,
        nowElapsed
      );

      let nextLastTickFloorSec = sw.lastTickFloorSec;
      const floorSec = Math.floor(nowElapsed / 1000);

      if (floorSec !== sw.lastTickFloorSec) {
        nextLastTickFloorSec = floorSec;

        if (cfg.stopwatchMode === 'interval') {
          for (let i = 1; i <= cfg.laneCount; i++) {
            const laneRt = afterWaves.lanes[i];
            if (laneRt && laneRt.nextWaveTimeMs !== Infinity) {
              const remSec = Math.round((laneRt.nextWaveTimeMs - nowElapsed) / 1000);
              if (remSec === 3 || remSec === 2 || remSec === 1) {
                playBeep('pip');
                break;
              }
            }
          }
        }
      }

      if (anyWaveLaunched) {
        playBeep('horn');
      }

      if (anyWaveLaunched || nextLastTickFloorSec !== sw.lastTickFloorSec) {
        const updated: StopwatchRuntime = {
          ...afterWaves,
          elapsedMs: nowElapsed,
          lastTickFloorSec: nextLastTickFloorSec
        };
        stopwatchRef.current = updated;
        setStopwatch(updated);
      } else {
        stopwatchRef.current.elapsedMs = nowElapsed;
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [stopwatch.isRunning]);

  const toggleClock = useCallback(() => {
    const sw = stopwatchRef.current;
    const cfg = configRef.current;
    const res = resultsRef.current;

    if (!sw.isRunning) {
      const isFreshStart = sw.elapsedMs === 0;
      const startTimestamp = performance.now() - sw.elapsedMs;
      let nextSw: StopwatchRuntime = {
        ...sw,
        isRunning: true,
        startTimestamp
      };

      if (isFreshStart) {
        nextSw = launchAllWaveZero(nextSw, cfg, res, 0);
        playBeep('horn');
        showToast('Set started — Wave 1 released!', 'info');
      } else {
        playBeep('pip');
        showToast('Clock resumed', 'info');
      }

      stopwatchRef.current = nextSw;
      setStopwatch(nextSw);
    } else {
      const nowElapsed = performance.now() - sw.startTimestamp;
      const nextSw: StopwatchRuntime = {
        ...sw,
        isRunning: false,
        elapsedMs: nowElapsed
      };
      stopwatchRef.current = nextSw;
      setDisplayElapsedMs(nowElapsed);
      setStopwatch(nextSw);

      const totalActiveSwimmers = Object.values(sw.lanes).reduce(
        (acc, lane) => acc + (lane?.activeSwimmers?.length || 0),
        0
      );
      if (totalActiveSwimmers === 0) {
        showToast('Timer stopped', 'info');
      } else {
        showToast('Clock paused', 'warning');
      }
    }
  }, [showToast]);

  const resetClock = useCallback(() => {
    const nextSw = createInitialStopwatchState(configRef.current.laneCount);
    stopwatchRef.current = nextSw;
    setDisplayElapsedMs(0);
    setStopwatch(nextSw);
    showToast('Master clock reset', 'info');
  }, [showToast]);

  const handleReleaseNextInLane = useCallback((laneNum: number) => {
    const sw = stopwatchRef.current;
    const cfg = configRef.current;
    const res = resultsRef.current;

    const names = getSwimmerNamesForLane(cfg.lanes[laneNum - 1]);
    if (names.length === 0) {
      showToast(`No swimmers configured in Lane ${laneNum}`, 'warning');
      return;
    }

    const nowElapsed = sw.isRunning ? performance.now() - sw.startTimestamp : sw.elapsedMs;
    const { stopwatch: nextSw, spawned, recycled } = releaseNextWaveInLane(
      sw,
      cfg,
      res,
      laneNum,
      nowElapsed
    );

    if (recycled) {
      showToast(`Lane ${laneNum}: Cycling back to Wave 1 (new rep)`, 'info');
    }

    if (spawned) {
      playBeep('horn');
      stopwatchRef.current = nextSw;
      setStopwatch(nextSw);
    } else if (cfg.stopwatchMode === 'manual') {
      const laneRt = sw.lanes[laneNum];
      if (laneRt && laneRt.nextWaveIndex >= names.length) {
        showToast(`Lane ${laneNum}: All assigned swimmers already released`, 'info');
      } else {
        const candidateName = laneRt ? names[laneRt.nextWaveIndex] : '';
        showToast(`Lane ${laneNum}: ${candidateName || 'Swimmer'} is already in the water`, 'warning');
      }
    }
  }, [showToast]);

  const handleReleaseAllLanes = useCallback(() => {
    const sw = stopwatchRef.current;
    const cfg = configRef.current;
    const res = resultsRef.current;

    if (!sw.isRunning && sw.elapsedMs === 0) {
      toggleClock();
      return;
    }

    const nowElapsed = sw.isRunning ? performance.now() - sw.startTimestamp : sw.elapsedMs;
    const { stopwatch: nextSw, releasedCount, recycledCount } = releaseNextWaveInAllLanes(
      sw,
      cfg,
      res,
      nowElapsed
    );

    if (releasedCount === 0) {
      if (cfg.stopwatchMode === 'manual') {
        showToast('All swimmers have already been released or are currently in the water', 'info');
      } else {
        showToast('No configured swimmers to release in active lanes', 'warning');
      }
      return;
    }

    playBeep('horn');
    stopwatchRef.current = nextSw;
    setStopwatch(nextSw);

    if (recycledCount > 0) {
      showToast(`Released next wave across ${releasedCount} lanes (${recycledCount} cycled to new rep)`, 'info');
    } else {
      showToast(`Released next wave across ${releasedCount} lanes`, 'info');
    }
  }, [showToast, toggleClock]);

  const handleStopSwimmer = useCallback((laneNum: number, swimmerId: string | null = null) => {
    const sw = stopwatchRef.current;
    const cfg = configRef.current;
    const nowElapsed = sw.isRunning ? performance.now() - sw.startTimestamp : sw.elapsedMs;

    const { stopwatch: nextSw, result } = recordSwimmerStop(
      sw,
      cfg,
      laneNum,
      swimmerId,
      nowElapsed
    );

    if (!result) return;
    playBeep('split');
    stopwatchRef.current = nextSw;
    setStopwatch(nextSw);
    setResults(prev => [result, ...prev]);
  }, [setResults]);

  const handleScratchSwimmer = useCallback((laneNum: number, swimmerId: string) => {
    const sw = stopwatchRef.current;
    const { stopwatch: nextSw, scratched } = recordSwimmerScratch(sw, laneNum, swimmerId);
    if (!scratched) return;

    stopwatchRef.current = nextSw;
    setStopwatch(nextSw);
    showToast(`Skipped ${scratched.name} (Lane ${laneNum})`, 'info');
  }, [showToast]);

  const handleUndo = useCallback(() => {
    const sw = stopwatchRef.current;
    if (sw.undoStack.length === 0) return;

    const last = sw.undoStack[sw.undoStack.length - 1];
    const remainingUndo = sw.undoStack.slice(0, -1);
    const laneRt = sw.lanes[last.lane];

    let nextActive = [...(laneRt?.activeSwimmers || [])];
    if (laneRt) {
      const insertAt = Math.min(last.swimmerIndex, nextActive.length);
      nextActive.splice(insertAt, 0, last.swimmerObj);
    }

    const nextSw: StopwatchRuntime = {
      ...sw,
      lanes: {
        ...sw.lanes,
        [last.lane]: {
          ...laneRt,
          activeSwimmers: nextActive
        }
      },
      undoStack: remainingUndo
    };

    stopwatchRef.current = nextSw;
    setStopwatch(nextSw);

    if (last.type === 'stop') {
      setResults(prev => prev.filter(r => r.id !== last.resultId));
      showToast(`Undid stop for ${last.swimmerObj.name} (Lane ${last.lane})`, 'info');
    } else if (last.type === 'scratch') {
      showToast(`Restored ${last.swimmerObj.name} to Lane ${last.lane}`, 'info');
    }
  }, [setResults, showToast]);

  return {
    stopwatch,
    displayElapsedMs,
    toggleClock,
    resetClock,
    handleReleaseNextInLane,
    handleReleaseAllLanes,
    handleStopSwimmer,
    handleScratchSwimmer,
    handleUndo
  };
}

