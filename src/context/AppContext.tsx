import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
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
  PoolCourse,
  Coach,
  CoachRole,
  ScheduledSession,
  WeeklySessionPlan,
  ClubClosure,
  SessionStaffOverride,
  ClubSetupTab,
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
  updateClubProfile: (profile: {
    clubName: string;
    shortName?: string;
    city?: string;
    country?: string;
    contactEmail?: string;
    contactPhone?: string;
    headCoachName?: string;
    establishedYear?: string;
    motto?: string;
    primaryPoolId?: string;
  }) => boolean;
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
  toggleSwimmerAttendance: (swimmerId: string) => void;
  markAllSwimmersPresent: (swimmerIds: string[]) => void;
  clearSwimmersAttendance: (swimmerIds?: string[]) => void;
  updateSessionDetails: (details: {
    sessionName?: string;
    sessionDate?: string;
    sessionTime?: string;
    selectedGroupIds?: string[];
    selectedPoolId?: string;
  }) => void;
  selectPool: (poolId: string) => void;
  savePool: (
    poolData: { name: string; laneCount: number; length: PoolCourse; notes?: string },
    editingPoolId?: string | null
  ) => boolean;
  deletePool: (poolId: string) => boolean;
  isPoolModalOpen: boolean;
  openPoolModal: () => void;
  closePoolModal: () => void;
  activeClubSetupTab: ClubSetupTab;
  setActiveClubSetupTab: (tab: ClubSetupTab) => void;
  saveCoach: (coachData: Partial<Coach> & { name: string; role: CoachRole }, editingCoachId?: string | null) => boolean;
  deleteCoach: (coachId: string) => boolean;
  saveScheduledSession: (sessionData: Omit<ScheduledSession, 'id'>, editingSessionId?: string | null) => boolean;
  deleteScheduledSession: (sessionId: string) => boolean;
  saveStaffOverride: (overrideData: Omit<SessionStaffOverride, 'id'>, editingOverrideId?: string | null) => boolean;
  deleteStaffOverride: (overrideId: string) => boolean;
  saveClubClosure: (closureData: Omit<ClubClosure, 'id'>, editingClosureId?: string | null) => boolean;
  deleteClubClosure: (closureId: string) => boolean;
  saveWeeklySessionPlan: (sessionId: string, planData: Omit<WeeklySessionPlan, 'id'>, existingPlanId?: string | null) => boolean;
  deleteWeeklySessionPlan: (sessionId: string, weekKey: string) => boolean;
  cloneWeeklySessionPlan: (sessionId: string, fromWeekKey: string, toWeekKey: string) => boolean;
  loadSessionFromSchedule: (scheduledSession: ScheduledSession, targetDate?: string) => void;
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
    activeClubSetupTab,
    setCurrentView,
    setActiveClubSetupTab,
    updateConfig,
    setResults,
    updateClub,
    setActiveGroupId,
    setPersisted
  } = usePersistentState();

  const { toasts, showToast, dismissToast } = useToasts();
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const openPoolModal = useCallback(() => setIsPoolModalOpen(true), []);
  const closePoolModal = useCallback(() => setIsPoolModalOpen(false), []);

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
      activeClubSetupTab,
      setCurrentView,
      setActiveClubSetupTab,
      updateConfig,
      setResults,
      updateClub,
      setActiveGroupId,
      toasts,
      showToast,
      dismissToast,
      isPoolModalOpen,
      openPoolModal,
      closePoolModal,
      ...clubActions
    }),
    [
      currentView,
      config,
      results,
      club,
      activeGroupId,
      activeClubSetupTab,
      setCurrentView,
      setActiveClubSetupTab,
      updateConfig,
      setResults,
      updateClub,
      setActiveGroupId,
      toasts,
      showToast,
      dismissToast,
      isPoolModalOpen,
      openPoolModal,
      closePoolModal,
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

