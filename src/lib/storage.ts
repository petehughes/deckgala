import { STORAGE_KEY } from './constants';
import { createDefaultClub } from './defaultClub';
import { createDefaultLanes } from './lanes';
import type { AppConfig, PersistedState, ViewName } from '../types';

export function getDefaultConfig(): AppConfig {
  return {
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

  return {
    currentView: 'setup',
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

    const results = Array.isArray(data.results) ? data.results : [];
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

    const validViews: ViewName[] = ['setup', 'swimmers', 'deck', 'results'];
    const currentView: ViewName = validViews.includes(data.currentView) ? data.currentView : 'setup';

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

