export type GroupColor = 'cyan' | 'teal' | 'amber' | 'rose' | 'violet' | 'emerald' | 'blue';
export type Gender = '' | 'F' | 'M' | 'X';
export type StopwatchMode = 'interval' | 'manual' | 'mass';
export type PoolCourse = '25m' | '50m' | '25y';
export type ViewName = 'attendance' | 'session' | 'swimmers' | 'deck' | 'results' | 'club-setup';
export type ClubSetupTab = 'profile' | 'calendar' | 'sessions' | 'staff' | 'pools';

export type CoachRole = 'head_coach' | 'coach' | 'assistant_coach' | 'guest_coach';

export interface Coach {
  id: string;
  name: string;
  role: CoachRole;
  email?: string;
  phone?: string;
  certifications?: string;
  notes?: string;
  color?: GroupColor;
  isHeadCoach?: boolean;
}

export type SessionRecurrence = 'weekly' | 'one_off';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface SwimSetItem {
  id: string;
  reps: number;
  distance: number;
  stroke: string;
  interval?: string;
  intensity?: 'warmup' | 'aerobic' | 'threshold' | 'lactate' | 'sprint' | 'recovery';
  description?: string;
  customLabel?: string;
}

export interface WeeklySessionPlan {
  id: string;
  weekNumber: number;
  year: number;
  weekKey: string; // e.g. "2026-W44"
  briefing: string;
  targetFocus?: string;
  expectedIntensity?: 'low' | 'moderate' | 'high' | 'race_pace';
  setList: SwimSetItem[];
  notes?: string;
}

export interface ScheduledSession {
  id: string;
  title: string;
  recurrence: SessionRecurrence;
  dayOfWeek?: DayOfWeek;
  specificDate?: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  poolId: string;
  groupIds: string[];
  defaultCoachId?: string;
  headCoachNotes?: string; // What is to be expected from the session (default fallback)
  targetFocus?: string;
  expectedIntensity?: 'low' | 'moderate' | 'high' | 'race_pace';
  weeklyPlans?: WeeklySessionPlan[];
}

export interface SessionStaffOverride {
  id: string;
  scheduledSessionId: string;
  date: string; // YYYY-MM-DD
  assignedCoachId: string; // The covering coach
  originalCoachId?: string;
  reason?: string; // e.g. "Holiday cover", "Illness"
  notes?: string;
}

export interface ClubClosure {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface Swimmer {
  id: string;
  name: string;
  age: number | '';
  gender: Gender;
  pb50m: string;
  pb100m: string;
  notes: string;
}

export interface SwimmingPool {
  id: string;
  name: string;
  laneCount: number;
  length: PoolCourse;
  notes?: string;
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
  shortName?: string;
  code?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  headCoachName?: string;
  establishedYear?: string;
  motto?: string;
  primaryPoolId?: string;
  groups: SwimmerGroup[];
  pools: SwimmingPool[];
  coaches: Coach[];
  scheduledSessions: ScheduledSession[];
  staffOverrides: SessionStaffOverride[];
  clubClosures: ClubClosure[];
}

export interface LaneConfig {
  lane: number;
  interval: number;
  swimmersText: string;
}

export interface AppConfig {
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  selectedPoolId?: string;
  presentSwimmerIds: string[];
  laneCount: number;
  setName: string;
  targetTime: number;
  poolCourse: PoolCourse;
  stopwatchMode: StopwatchMode;
  selectedGroupIds: string[];
  lanes: LaneConfig[];
  assignedCoachId?: string;
  coveringCoachId?: string;
  headCoachNotes?: string;
  scheduledSessionId?: string;
  activeWeeklyPlan?: WeeklySessionPlan;
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
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
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
  activeClubSetupTab?: ClubSetupTab;
}

export interface RosterSort {
  field: 'name' | 'age';
  dir: 'asc' | 'desc';
}
