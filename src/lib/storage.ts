import { STORAGE_KEY, LEGACY_STORAGE_KEY } from './constants';
import {
  createDefaultClub,
  DEFAULT_POOLS,
  DEFAULT_COACHES,
  DEFAULT_SCHEDULED_SESSIONS,
  DEFAULT_CLUB_CLOSURES,
  DEFAULT_STAFF_OVERRIDES
} from './defaultClub';
import { DEFAULT_ANNUAL_TARGETS } from './targets';
import { createDefaultLanes } from './lanes';
import type {
  AppConfig,
  PersistedState,
  ViewName,
  SwimmingPool,
  PoolCourse,
  Coach,
  ScheduledSession,
  ClubClosure,
  SessionStaffOverride,
  AnnualTarget,
  SwimmerPB,
  ClubSetupTab
} from '../types';

export function getDefaultConfig(): AppConfig {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const timeStr = today.toTimeString().slice(0, 5);

  return {
    sessionName: 'Morning Training Session',
    sessionDate: dateStr,
    sessionTime: timeStr,
    selectedPoolId: 'pool-main-25m',
    presentSwimmerIds: [],
    laneCount: 6,
    setName: '10 x 100m Freestyle',
    targetTime: 75,
    poolCourse: '25m',
    stopwatchMode: 'interval',
    selectedGroupIds: ['grp-senior-perf', 'grp-age-group-gold'],
    lanes: createDefaultLanes(6),
    assignedCoachId: 'coach-sarah',
    headCoachNotes: 'Focus on underwater streamline to 15m and holding threshold pacing.'
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

  const defaultSession = defaultClub.scheduledSessions[0];
  if (defaultSession) {
    defaultConfig.scheduledSessionId = defaultSession.id;
    if (defaultSession.weeklyPlans && defaultSession.weeklyPlans.length > 0) {
      defaultConfig.activeWeeklyPlan = defaultSession.weeklyPlans.find(p => p.weekKey === '2026-W44') || defaultSession.weeklyPlans[0];
      if (defaultConfig.activeWeeklyPlan?.briefing) {
        defaultConfig.headCoachNotes = defaultConfig.activeWeeklyPlan.briefing;
      }
    }
  }

  return {
    currentView: 'attendance',
    config: defaultConfig,
    results: [],
    club: defaultClub,
    activeGroupId: defaultClub.groups[0]?.id || null,
    activeClubSetupTab: 'calendar'
  };
}

export function loadPersistedState(): PersistedState {
  const initial = getInitialState();
  try {
    if (typeof localStorage === 'undefined') return initial;
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return initial;

    const data = JSON.parse(raw);
    const config: AppConfig = { ...initial.config };

    let club = initial.club;
    if (data.club && Array.isArray(data.club.groups)) {
      const parsedPools: SwimmingPool[] = Array.isArray(data.club.pools) && data.club.pools.length > 0
        ? data.club.pools.map((p: Record<string, unknown>) => ({
            id: String(p.id || `pool-${Date.now()}`),
            name: String(p.name || 'Swimming Pool'),
            laneCount: Math.min(10, Math.max(1, parseInt(String(p.laneCount), 10) || 6)),
            length: (['25m', '50m', '25y'].includes(String(p.length)) ? String(p.length) : '25m') as PoolCourse,
            notes: typeof p.notes === 'string' ? p.notes : ''
          }))
        : DEFAULT_POOLS;

      const parsedCoaches: Coach[] = Array.isArray(data.club.coaches) && data.club.coaches.length > 0
        ? data.club.coaches.map((c: Record<string, unknown>) => ({
            id: String(c.id || `coach-${Date.now()}`),
            name: String(c.name || 'Coach'),
            role: (c.role as Coach['role']) || 'coach',
            email: typeof c.email === 'string' ? c.email : '',
            phone: typeof c.phone === 'string' ? c.phone : '',
            certifications: typeof c.certifications === 'string' ? c.certifications : '',
            notes: typeof c.notes === 'string' ? c.notes : '',
            color: (c.color as Coach['color']) || 'cyan',
            isHeadCoach: Boolean(c.isHeadCoach)
          }))
        : DEFAULT_COACHES;

      const parsedScheduledSessions: ScheduledSession[] = Array.isArray(data.club.scheduledSessions) && data.club.scheduledSessions.length > 0
        ? data.club.scheduledSessions.map((s: Record<string, unknown>) => ({
            id: String(s.id || `sched-${Date.now()}`),
            title: String(s.title || 'Training Session'),
            recurrence: (s.recurrence === 'one_off' ? 'one_off' : 'weekly') as ScheduledSession['recurrence'],
            dayOfWeek: typeof s.dayOfWeek === 'number' ? (s.dayOfWeek as ScheduledSession['dayOfWeek']) : 1,
            specificDate: typeof s.specificDate === 'string' ? s.specificDate : undefined,
            startTime: String(s.startTime || '18:00'),
            endTime: String(s.endTime || '19:30'),
            poolId: String(s.poolId || parsedPools[0]?.id || 'pool-main-25m'),
            groupIds: Array.isArray(s.groupIds) ? (s.groupIds as string[]) : [],
            defaultCoachId: typeof s.defaultCoachId === 'string' ? s.defaultCoachId : undefined,
            headCoachNotes: typeof s.headCoachNotes === 'string' ? s.headCoachNotes : '',
            targetFocus: typeof s.targetFocus === 'string' ? s.targetFocus : '',
            expectedIntensity: (s.expectedIntensity as ScheduledSession['expectedIntensity']) || 'high',
            weeklyPlans: Array.isArray(s.weeklyPlans) ? (s.weeklyPlans as ScheduledSession['weeklyPlans']) : []
          }))
        : DEFAULT_SCHEDULED_SESSIONS;

      const parsedStaffOverrides: SessionStaffOverride[] = Array.isArray(data.club.staffOverrides)
        ? data.club.staffOverrides.map((o: Record<string, unknown>) => ({
            id: String(o.id || `override-${Date.now()}`),
            scheduledSessionId: String(o.scheduledSessionId || ''),
            date: String(o.date || ''),
            assignedCoachId: String(o.assignedCoachId || ''),
            originalCoachId: typeof o.originalCoachId === 'string' ? o.originalCoachId : undefined,
            reason: typeof o.reason === 'string' ? o.reason : '',
            notes: typeof o.notes === 'string' ? o.notes : ''
          }))
        : DEFAULT_STAFF_OVERRIDES;

      const parsedClubClosures: ClubClosure[] = Array.isArray(data.club.clubClosures) && data.club.clubClosures.length > 0
        ? data.club.clubClosures.map((c: Record<string, unknown>) => ({
            id: String(c.id || `closure-${Date.now()}`),
            title: String(c.title || 'Club Closure'),
            startDate: String(c.startDate || ''),
            endDate: String(c.endDate || ''),
            reason: typeof c.reason === 'string' ? c.reason : ''
          }))
        : DEFAULT_CLUB_CLOSURES;

      const parsedAnnualTargets: AnnualTarget[] = Array.isArray(data.club.annualTargets) && data.club.annualTargets.length > 0
        ? data.club.annualTargets.map((t: Record<string, unknown>) => ({
            id: String(t.id || `target-${Date.now()}`),
            competitionName: String(t.competitionName || 'Target Competition'),
            level: (t.level as AnnualTarget['level']) || 'county',
            year: Number(t.year) || 2026,
            stroke: (t.stroke as AnnualTarget['stroke']) || 'Freestyle',
            distance: Number(t.distance) || 100,
            course: (t.course as AnnualTarget['course']) || '25m',
            gender: (t.gender as AnnualTarget['gender']) || 'Open',
            minAge: typeof t.minAge === 'number' ? t.minAge : undefined,
            maxAge: typeof t.maxAge === 'number' ? t.maxAge : undefined,
            qualifyingTime: String(t.qualifyingTime || '01:00.00'),
            qualifyingTimeMs: Number(t.qualifyingTimeMs) || 60000,
            considerationTime: typeof t.considerationTime === 'string' ? t.considerationTime : undefined,
            considerationTimeMs: typeof t.considerationTimeMs === 'number' ? t.considerationTimeMs : undefined,
            notes: typeof t.notes === 'string' ? t.notes : ''
          }))
        : DEFAULT_ANNUAL_TARGETS;

      club = {
        clubName: data.club.clubName || 'DeckGala Swim Club',
        shortName: typeof data.club.shortName === 'string' ? data.club.shortName : 'DGSC',
        code: typeof data.club.code === 'string' ? data.club.code : 'DGSC',
        city: typeof data.club.city === 'string' ? data.club.city : 'Manchester',
        country: typeof data.club.country === 'string' ? data.club.country : 'United Kingdom',
        contactEmail: typeof data.club.contactEmail === 'string' ? data.club.contactEmail : 'info@deckgala.com',
        contactPhone: typeof data.club.contactPhone === 'string' ? data.club.contactPhone : '+44 7700 900123',
        headCoachName: typeof data.club.headCoachName === 'string' ? data.club.headCoachName : 'Coach Sarah Jenkins',
        establishedYear: typeof data.club.establishedYear === 'string' ? data.club.establishedYear : '2012',
        motto: typeof data.club.motto === 'string' ? data.club.motto : 'High Performance Poolside Excellence',
        primaryPoolId: typeof data.club.primaryPoolId === 'string' ? data.club.primaryPoolId : parsedPools[0]?.id || 'pool-main-25m',
        pools: parsedPools,
        coaches: parsedCoaches,
        scheduledSessions: parsedScheduledSessions,
        staffOverrides: parsedStaffOverrides,
        clubClosures: parsedClubClosures,
        annualTargets: parsedAnnualTargets,
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
                notes: String(s.notes || ''),
                personalBests: Array.isArray(s.personalBests) ? (s.personalBests as SwimmerPB[]) : undefined
              }))
            : []
        }))
      };
    }

    if (data.config) {
      config.sessionName = typeof data.config.sessionName === 'string' ? data.config.sessionName : initial.config.sessionName;
      config.sessionDate = typeof data.config.sessionDate === 'string' ? data.config.sessionDate : initial.config.sessionDate;
      config.sessionTime = typeof data.config.sessionTime === 'string' ? data.config.sessionTime : initial.config.sessionTime;
      config.selectedPoolId = typeof data.config.selectedPoolId === 'string' && club.pools.some(p => p.id === data.config.selectedPoolId)
        ? data.config.selectedPoolId
        : club.pools[0]?.id || 'pool-main-25m';
      config.presentSwimmerIds = Array.isArray(data.config.presentSwimmerIds) ? data.config.presentSwimmerIds : initial.config.presentSwimmerIds;
      config.laneCount = Math.min(10, Math.max(1, parseInt(String(data.config.laneCount), 10) || 6));
      config.setName = data.config.setName ?? '10 x 100m Freestyle';
      config.targetTime = parseFloat(String(data.config.targetTime)) || 0;
      config.poolCourse = data.config.poolCourse || '25m';
      config.stopwatchMode = data.config.stopwatchMode || 'interval';
      config.assignedCoachId = typeof data.config.assignedCoachId === 'string' ? data.config.assignedCoachId : club.coaches[0]?.id;
      config.coveringCoachId = typeof data.config.coveringCoachId === 'string' ? data.config.coveringCoachId : undefined;
      config.headCoachNotes = typeof data.config.headCoachNotes === 'string' ? data.config.headCoachNotes : '';
      config.scheduledSessionId = typeof data.config.scheduledSessionId === 'string' ? data.config.scheduledSessionId : undefined;
      if (data.config.activeWeeklyPlan && typeof data.config.activeWeeklyPlan === 'object') {
        config.activeWeeklyPlan = data.config.activeWeeklyPlan as AppConfig['activeWeeklyPlan'];
      }

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

    let activeGroupId: string | null = data.activeGroupId || club.groups[0]?.id || null;
    if (activeGroupId && !club.groups.some(g => g.id === activeGroupId)) {
      activeGroupId = club.groups[0]?.id || null;
    }

    const validViews: ViewName[] = ['attendance', 'session', 'swimmers', 'deck', 'results', 'club-setup'];
    let currentView: ViewName = 'attendance';
    if (data.currentView === 'setup') {
      currentView = 'session';
    } else if (validViews.includes(data.currentView)) {
      currentView = data.currentView;
    }

    const activeClubSetupTab: ClubSetupTab = ['sessions', 'calendar', 'staff', 'pools'].includes(data.activeClubSetupTab)
      ? data.activeClubSetupTab
      : 'calendar';

    return {
      currentView,
      config,
      results,
      club,
      activeGroupId,
      activeClubSetupTab
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
      activeGroupId: state.activeGroupId,
      activeClubSetupTab: state.activeClubSetupTab
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage quota exceeded or private browsing
  }
}
