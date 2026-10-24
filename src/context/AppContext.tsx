import React, { createContext, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToasts } from '../hooks/useToasts';
import { useStopwatch } from '../hooks/useStopwatch';
import { useClubActions } from '../hooks/useClubActions';
import type {
  AppConfig,
  ClubData,
  GroupColor,
  ImportOptions,
  PendingImport,
  StopwatchRuntime,
  SwimResult,
  Swimmer,
  ToastItem,
  ViewName
} from '../types';

export interface AppContextValue {
  currentView: ViewName;
  config: AppConfig;
  results: SwimResult[];
  club: ClubData;
  activeGroupId: string | null;
  setCurrentView: (view: ViewName) => void;
  updateConfig: (updater: Partial<AppConfig> | ((prev: AppConfig) => AppConfig)) => void;
  setResults: (updater: SwimResult[] | ((prev: SwimResult[]) => SwimResult[])) => void;
  updateClub: (updater: Partial<ClubData> | ((prev: ClubData) => ClubData)) => void;
  setActiveGroupId: (groupId: string | null) => void;
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: number) => void;
  setClubName: (clubName: string) => void;
  saveGroup: (
    groupData: { name: string; coach: string; description: string; color: GroupColor },
    editingGroupId?: string | null
  ) => boolean;
  deleteGroup: (groupId: string) => void;
  saveSwimmer: (
    swimmerData: Partial<Swimmer> & { name: string },
    targetGroupId?: string,
    editingSwimmerId?: string | null
  ) => boolean;
  deleteSwimmer: (swimmerId: string, groupId?: string | null) => void;
  bulkAddSwimmers: (rawText: string, groupId?: string | null) => boolean;
  executeImport: (pendingImport: PendingImport, options: ImportOptions) => boolean;
  toggleSessionGroup: (groupId: string) => void;
  selectAllSessionGroups: () => void;
  clearSessionGroups: () => void;
  autoDistributeSwimmers: () => void;
  clearAllLanesSwimmers: () => void;
  addSwimmerToLane: (laneIndex: number, swimmerName: string) => void;
  removeSwimmerFromLane: (laneIndex: number, waveIdx: number) => void;
  moveSwimmerInLane: (laneIndex: number, waveIdx: number, direction: number) => void;
  setLaneInterval: (laneIndex: number, intervalSec: number) => void;
  setLaneSwimmersText: (laneIndex: number, text: string) => void;
}

export interface StopwatchContextValue {
  stopwatch: StopwatchRuntime;
  toggleClock: () => void;
  resetClock: () => void;
  handleReleaseNextInLane: (laneNum: number) => void;
  handleReleaseAllLanes: () => void;
  handleStopSwimmer: (laneNum: number, swimmerId?: string | null) => void;
  handleScratchSwimmer: (laneNum: number, swimmerId: string) => void;
  handleUndo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const StopwatchContext = createContext<StopwatchContextValue | null>(null);
const ElapsedContext = createContext<number>(0);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const {
    currentView,
    config,
    results,
    club,
    activeGroupId,
    setCurrentView,
    updateConfig,
    setResults,
    updateClub,
    setActiveGroupId,
    setPersisted
  } = usePersistentState();

  const { toasts, showToast, dismissToast } = useToasts();

  const {
    stopwatch,
    displayElapsedMs,
    toggleClock,
    resetClock,
    handleReleaseNextInLane,
    handleReleaseAllLanes,
    handleStopSwimmer,
    handleScratchSwimmer,
    handleUndo
  } = useStopwatch({
    config,
    results,
    setResults,
    showToast
  });

  const clubActions = useClubActions({
    club,
    activeGroupId,
    config,
    setPersisted,
    showToast
  });

  const appValue = useMemo<AppContextValue>(
    () => ({
      currentView,
      config,
      results,
      club,
      activeGroupId,
      setCurrentView,
      updateConfig,
      setResults,
      updateClub,
      setActiveGroupId,
      toasts,
      showToast,
      dismissToast,
      ...clubActions
    }),
    [
      currentView,
      config,
      results,
      club,
      activeGroupId,
      setCurrentView,
      updateConfig,
      setResults,
      updateClub,
      setActiveGroupId,
      toasts,
      showToast,
      dismissToast,
      clubActions
    ]
  );

  const stopwatchValue = useMemo<StopwatchContextValue>(
    () => ({
      stopwatch,
      toggleClock,
      resetClock,
      handleReleaseNextInLane,
      handleReleaseAllLanes,
      handleStopSwimmer,
      handleScratchSwimmer,
      handleUndo
    }),
    [
      stopwatch,
      toggleClock,
      resetClock,
      handleReleaseNextInLane,
      handleReleaseAllLanes,
      handleStopSwimmer,
      handleScratchSwimmer,
      handleUndo
    ]
  );

  return (
    <AppContext.Provider value={appValue}>
      <StopwatchContext.Provider value={stopwatchValue}>
        <ElapsedContext.Provider value={displayElapsedMs}>
          {children}
        </ElapsedContext.Provider>
      </StopwatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useStopwatchState(): StopwatchContextValue {
  const ctx = useContext(StopwatchContext);
  if (!ctx) throw new Error('useStopwatchState must be used inside AppProvider');
  return ctx;
}

export function useElapsedMs(): number {
  return useContext(ElapsedContext);
}

