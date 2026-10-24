import { STORAGE_KEY } from './constants';
import { createDefaultClub } from './defaultClub';
import { createDefaultLanes } from './lanes';
import type { AppConfig, PersistedState, ViewName } from '../types';

export function getDefaultConfig(): AppConfig {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const timeStr = today.toTimeString().slice(0, 5);

  return {
    sessionName: 'Morning Training Session',
    sessionDate: dateStr,
    sessionTime: timeStr,
    presentSwimmerIds: [],
    laneCount: 6,
    setName: '10 x 100m Freestyle',
    targetTime: 75,
    poolCourse: '25m',
    stopwatchMode: 'interval',
    selectedGroupIds: ['grp-senior-perf', 'grp-age-group-gold'],
    lanes: createDefaultLanes(6)
  };
}

export function getInitialState(): PersistedState {
  const defaultClub = createDefaultClub();
  const defaultConfig = getDefaultConfig();

  // Initially mark swimmers in the default selected squads as present
  const defaultPresent = defaultClub.groups
    .filter(g => defaultConfig.selectedGroupIds.includes(g.id))
    .flatMap(g => g.swimmers.map(s => s.id));
  defaultConfig.presentSwimmerIds = defaultPresent;

  return {
    currentView: 'attendance',
    config: defaultConfig,
    results: [],
    club: defaultClub,
    activeGroupId: defaultClub.groups[0]?.id || null
  };
}

export function loadPersistedState(): PersistedState {
  const initial = getInitialState();
  try {
    if (typeof localStorage === 'undefined') return initial;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;

    const data = JSON.parse(raw);
    const config: AppConfig = { ...initial.config };

    if (data.config) {
      config.sessionName = typeof data.config.sessionName === 'string' ? data.config.sessionName : initial.config.sessionName;
      config.sessionDate = typeof data.config.sessionDate === 'string' ? data.config.sessionDate : initial.config.sessionDate;
      config.sessionTime = typeof data.config.sessionTime === 'string' ? data.config.sessionTime : initial.config.sessionTime;
      config.presentSwimmerIds = Array.isArray(data.config.presentSwimmerIds) ? data.config.presentSwimmerIds : initial.config.presentSwimmerIds;
      config.laneCount = Math.min(10, Math.max(1, parseInt(String(data.config.laneCount), 10) || 6));
      config.setName = data.config.setName ?? '10 x 100m Freestyle';
      config.targetTime = parseFloat(String(data.config.targetTime)) || 0;
      config.poolCourse = data.config.poolCourse || '25m';
      config.stopwatchMode = data.config.stopwatchMode || 'interval';
      if (Array.isArray(data.config.selectedGroupIds)) {
        config.selectedGroupIds = data.config.selectedGroupIds;
      }
      if (Array.isArray(data.config.lanes) && data.config.lanes.length === 10) {
        config.lanes = data.config.lanes.map((l: Record<string, unknown>, idx: number) => ({
          lane: idx + 1,
          interval: Math.max(0, parseInt(String(l.interval), 10) || 5),
          swimmersText: typeof l.swimmersText === 'string' ? l.swimmersText : ''
        }));
      }
    }

    const results = Array.isArray(data.results)
      ? data.results.map((r: Record<string, unknown>) => ({
          id: String(r.id || `res-${Date.now()}`),
          timestamp: String(r.timestamp || ''),
          sessionName: String(r.sessionName || config.sessionName),
          sessionDate: String(r.sessionDate || config.sessionDate),
          sessionTime: String(r.sessionTime || config.sessionTime),
          setName: String(r.setName || config.setName),
          lane: Number(r.lane) || 1,
          swimmer: String(r.swimmer || 'Swimmer'),
          wave: Number(r.wave) || 1,
          rep: Number(r.rep) || 1,
          netTimeMs: Number(r.netTimeMs) || 0,
          finishWallMs: Number(r.finishWallMs) || 0,
          targetTimeSec: Number(r.targetTimeSec) || 0
        }))
      : [];
    let club = initial.club;
    if (data.club && Array.isArray(data.club.groups)) {
      club = {
        clubName: data.club.clubName || 'AquaPace Swim Club',
        groups: data.club.groups.map((g: Record<string, unknown>) => ({
          id: String(g.id || `grp-${Date.now()}`),
          name: String(g.name || 'Unnamed Squad'),
          description: String(g.description || ''),
          coach: String(g.coach || ''),
          color: (g.color as PersistedState['club']['groups'][0]['color']) || 'cyan',
          swimmers: Array.isArray(g.swimmers)
            ? g.swimmers.map((s: Record<string, unknown>) => ({
                id: String(s.id || `sw-${Date.now()}-${Math.random()}`),
                name: String(s.name || 'Swimmer'),
                age: typeof s.age === 'number' ? s.age : (s.age ? Number(s.age) || '' : ''),
                gender: (s.gender as PersistedState['club']['groups'][0]['swimmers'][0]['gender']) || '',
                pb50m: String(s.pb50m || ''),
                pb100m: String(s.pb100m || ''),
                notes: String(s.notes || '')
              }))
            : []
        }))
      };
    }

    let activeGroupId: string | null = data.activeGroupId || club.groups[0]?.id || null;
    if (activeGroupId && !club.groups.some(g => g.id === activeGroupId)) {
      activeGroupId = club.groups[0]?.id || null;
    }

    const validViews: ViewName[] = ['attendance', 'setup', 'swimmers', 'deck', 'results'];
    const currentView: ViewName = validViews.includes(data.currentView) ? data.currentView : 'attendance';

    return {
      currentView,
      config,
      results,
      club,
      activeGroupId
    };
  } catch {
    return initial;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const payload = {
      config: state.config,
      results: state.results,
      currentView: state.currentView,
      club: state.club,
      activeGroupId: state.activeGroupId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage quota exceeded or private browsing
  }
}

