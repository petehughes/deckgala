export type GroupColor = 'cyan' | 'teal' | 'amber' | 'rose' | 'violet' | 'emerald' | 'blue';
export type Gender = '' | 'F' | 'M' | 'X';
export type StopwatchMode = 'interval' | 'manual' | 'mass';
export type PoolCourse = '25m' | '50m' | '25y';
export type ViewName = 'setup' | 'swimmers' | 'deck' | 'results';

export interface Swimmer {
  id: string;
  name: string;
  age: number | '';
  gender: Gender;
  pb50m: string;
  pb100m: string;
  notes: string;
}

export interface SwimmerGroup {
  id: string;
  name: string;
  description: string;
  coach: string;
  color: GroupColor;
  swimmers: Swimmer[];
}

export interface ClubData {
  clubName: string;
  groups: SwimmerGroup[];
}

export interface LaneConfig {
  lane: number;
  interval: number;
  swimmersText: string;
}

export interface AppConfig {
  laneCount: number;
  setName: string;
  targetTime: number;
  poolCourse: PoolCourse;
  stopwatchMode: StopwatchMode;
  selectedGroupIds: string[];
  lanes: LaneConfig[];
}

export interface ActiveSwimmer {
  id: string;
  lane: number;
  name: string;
  wave: number;
  startTimeMs: number;
  rep: number;
}

export interface SwimResult {
  id: string;
  timestamp: string;
  setName: string;
  lane: number;
  swimmer: string;
  wave: number;
  rep: number;
  netTimeMs: number;
  finishWallMs: number;
  targetTimeSec: number;
}

export interface UndoStopAction {
  type: 'stop';
  resultId: string;
  swimmerObj: ActiveSwimmer;
  lane: number;
  swimmerIndex: number;
}

export interface UndoScratchAction {
  type: 'scratch';
  swimmerObj: ActiveSwimmer;
  lane: number;
  swimmerIndex: number;
}

export type UndoAction = UndoStopAction | UndoScratchAction;

export interface StopwatchRuntime {
  isRunning: boolean;
  startTimestamp: number;
  elapsedMs: number;
  lastTickFloorSec: number;
  lanes: Record<number, {
    nextWaveIndex: number;
    nextWaveTimeMs: number;
    activeSwimmers: ActiveSwimmer[];
  }>;
  undoStack: UndoAction[];
}

export interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface PendingImport {
  fileName: string;
  format: 'json' | 'csv';
  detectedScope: 'club' | 'group';
  clubName: string;
  groups: SwimmerGroup[];
  totalSwimmers: number;
}

export interface ImportOptions {
  targetScope: 'club' | 'group';
  clubImportMode: 'merge' | 'replace';
  groupImportTarget: string;
  newGroupName?: string;
}

export interface PersistedState {
  currentView: ViewName;
  config: AppConfig;
  results: SwimResult[];
  club: ClubData;
  activeGroupId: string | null;
}

export interface RosterSort {
  field: 'name' | 'age';
  dir: 'asc' | 'desc';
}
