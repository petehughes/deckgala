import type {
  ClubData,
  SwimmingPool,
  Coach,
  ScheduledSession,
  ClubClosure,
  SessionStaffOverride
} from '../types';

export const DEFAULT_POOLS: SwimmingPool[] = [
  {
    id: 'pool-main-25m',
    name: 'Main Competition Pool',
    laneCount: 6,
    length: '25m',
    notes: '25m short course training pool'
  },
  {
    id: 'pool-olympic-50m',
    name: 'Olympic Long Course Pool',
    laneCount: 8,
    length: '50m',
    notes: '50m long course Olympic standard'
  },
  {
    id: 'pool-outdoor-25y',
    name: 'Outdoor Training Pool',
    laneCount: 6,
    length: '25y',
    notes: '25y short course yards facility'
  }
];

export const DEFAULT_COACHES: Coach[] = [
  {
    id: 'coach-sarah',
    name: 'Coach Sarah Jenkins',
    role: 'head_coach',
    email: 'sarah.jenkins@deckgala.com',
    phone: '+44 7700 900123',
    certifications: 'Swim England Senior Coach (Level 3), NPLQ, Safeguarding',
    notes: 'Head Coach overseeing Senior Performance & club periodization.',
    color: 'cyan',
    isHeadCoach: true
  },
  {
    id: 'coach-marcus',
    name: 'Coach Marcus Vance',
    role: 'coach',
    email: 'marcus.vance@deckgala.com',
    phone: '+44 7700 900456',
    certifications: 'Swim England Coach (Level 2), First Aid at Work',
    notes: 'Age Group Lead Coach — County and Regional pathways.',
    color: 'teal',
    isHeadCoach: false
  },
  {
    id: 'coach-elena',
    name: 'Coach Elena Rostova',
    role: 'coach',
    email: 'elena.rostova@deckgala.com',
    phone: '+44 7700 900789',
    certifications: 'Swim England Coach (Level 2), Biomechanics Specialist',
    notes: 'Junior Development Squad & stroke technique fundamentals.',
    color: 'amber',
    isHeadCoach: false
  },
  {
    id: 'coach-david',
    name: 'Coach David Sterling',
    role: 'coach',
    email: 'david.sterling@deckgala.com',
    phone: '+44 7700 900234',
    certifications: 'Masters Swimming Coach, Triathlon Level 2',
    notes: 'Masters Fitness & adult competitive conditioning.',
    color: 'violet',
    isHeadCoach: false
  }
];

export const DEFAULT_SCHEDULED_SESSIONS: ScheduledSession[] = [
  {
    id: 'sched-wed-8pm',
    title: 'Wednesday Evening Performance Aerobic',
    recurrence: 'weekly',
    dayOfWeek: 3, // Wednesday
    startTime: '20:00',
    endTime: '21:30',
    poolId: 'pool-main-25m',
    groupIds: ['grp-senior-perf', 'grp-age-group-gold'],
    defaultCoachId: 'coach-sarah',
    headCoachNotes: 'High-volume aerobic threshold set (10 x 100m Free @ 1:30). Swimmers are expected to maintain target pace with minimum 4 dolphin kicks off each turn.',
    targetFocus: 'Aerobic Threshold & Turn Execution',
    expectedIntensity: 'high',
    weeklyPlans: [
      {
        id: 'wplan-wed-w43',
        weekNumber: 43,
        year: 2026,
        weekKey: '2026-W43',
        briefing: 'Week 43 Aerobic Foundation: 10 x 100m Free @ 1:30 holding steady splits. Focus on tight streamlines off each turn.',
        targetFocus: 'Aerobic Base Foundation',
        expectedIntensity: 'high',
        setList: [
          { id: 'set-w43-1', reps: 1, distance: 400, stroke: 'Choice', interval: 'Easy', intensity: 'warmup', description: 'Swim / Kick / Pull mix' },
          { id: 'set-w43-2', reps: 8, distance: 50, stroke: 'Kick', interval: '@ 1:15', intensity: 'aerobic', description: 'Kick with board 15m breakout' },
          { id: 'set-w43-3', reps: 10, distance: 100, stroke: 'Free', interval: '@ 1:30', intensity: 'threshold', description: 'Target 1:12-1:15 holding' },
          { id: 'set-w43-4', reps: 1, distance: 200, stroke: 'Choice', interval: 'Easy', intensity: 'recovery', description: 'Cool-down easy' }
        ]
      },
      {
        id: 'wplan-wed-w44',
        weekNumber: 44,
        year: 2026,
        weekKey: '2026-W44',
        briefing: 'Week 44 Lactate Threshold & Turn Speed: 6 x 200m Free @ 2:50. Minimum 4 dolphin kicks past the 5m flag off every wall.',
        targetFocus: 'Lactate Threshold & Turn Speed',
        expectedIntensity: 'high',
        setList: [
          { id: 'set-w44-1', reps: 1, distance: 400, stroke: 'Choice', interval: 'Easy', intensity: 'warmup', description: 'Warm-up mix' },
          { id: 'set-w44-2', reps: 6, distance: 50, stroke: 'Drill', interval: '@ 1:10', intensity: 'aerobic', description: 'Finger-tip drag & catch-up' },
          { id: 'set-w44-3', reps: 6, distance: 200, stroke: 'Free', interval: '@ 2:50', intensity: 'threshold', description: 'Descending 1-3, 4-6 holding pace' },
          { id: 'set-w44-4', reps: 8, distance: 25, stroke: 'Choice', interval: '@ 0:45', intensity: 'sprint', description: 'Speed breakouts' },
          { id: 'set-w44-5', reps: 1, distance: 200, stroke: 'Choice', interval: 'Easy', intensity: 'recovery', description: 'Easy flush-out' }
        ]
      }
    ]
  },
  {
    id: 'sched-mon-6am',
    title: 'Monday Morning Early Aerobic Base',
    recurrence: 'weekly',
    dayOfWeek: 1, // Monday
    startTime: '06:00',
    endTime: '07:30',
    poolId: 'pool-olympic-50m',
    groupIds: ['grp-senior-perf'],
    defaultCoachId: 'coach-sarah',
    headCoachNotes: 'Long course aerobic capacity. Focus on clean stroke distance and breath control under fatigue.',
    targetFocus: 'Long Course Distance Per Stroke',
    expectedIntensity: 'moderate'
  },
  {
    id: 'sched-fri-6pm',
    title: 'Friday Speed & Relay Breakouts',
    recurrence: 'weekly',
    dayOfWeek: 5, // Friday
    startTime: '18:00',
    endTime: '19:30',
    poolId: 'pool-main-25m',
    groupIds: ['grp-senior-perf', 'grp-age-group-gold', 'grp-junior-dev'],
    defaultCoachId: 'coach-marcus',
    headCoachNotes: 'Race pace sprints and relay reaction times. Diving blocks in use for lanes 1 to 6.',
    targetFocus: 'Sprint Speed & Reaction Times',
    expectedIntensity: 'race_pace'
  },
  {
    id: 'sched-sat-8am',
    title: 'Saturday Technique & Skills Clinic',
    recurrence: 'weekly',
    dayOfWeek: 6, // Saturday
    startTime: '08:00',
    endTime: '09:30',
    poolId: 'pool-outdoor-25y',
    groupIds: ['grp-junior-dev'],
    defaultCoachId: 'coach-elena',
    headCoachNotes: 'IM transitions, underwater pullouts, and turn drills. Fins and kickboards required.',
    targetFocus: 'Stroke Technique & Turns',
    expectedIntensity: 'moderate'
  }
];

export const DEFAULT_CLUB_CLOSURES: ClubClosure[] = [
  {
    id: 'closure-christmas',
    title: 'Christmas & New Year Holiday Closure',
    startDate: '2026-12-24',
    endDate: '2027-01-02',
    reason: 'Annual facility holiday shutdown. No club training sessions.'
  },
  {
    id: 'closure-easter',
    title: 'Easter Weekend Facility Closure',
    startDate: '2026-04-03',
    endDate: '2026-04-06',
    reason: 'Bank holiday weekend center closure.'
  }
];

export const DEFAULT_STAFF_OVERRIDES: SessionStaffOverride[] = [
  {
    id: 'override-week14',
    scheduledSessionId: 'sched-mon-6am',
    date: '2026-11-09',
    assignedCoachId: 'coach-marcus',
    originalCoachId: 'coach-sarah',
    reason: 'Coach Sarah Annual Leave / Holiday Cover',
    notes: 'Marcus covering Monday 6:00 AM session during Sarah holiday.'
  }
];

export function createDefaultClub(): ClubData {
  return {
    clubName: 'DeckGala Swim Club',
    shortName: 'DGSC',
    code: 'DGSC',
    city: 'Manchester',
    country: 'United Kingdom',
    contactEmail: 'info@deckgala.com',
    contactPhone: '+44 7700 900123',
    headCoachName: 'Coach Sarah Jenkins',
    establishedYear: '2012',
    motto: 'High Performance Poolside Excellence',
    primaryPoolId: 'pool-main-25m',
    pools: DEFAULT_POOLS,
    coaches: DEFAULT_COACHES,
    scheduledSessions: DEFAULT_SCHEDULED_SESSIONS,
    staffOverrides: DEFAULT_STAFF_OVERRIDES,
    clubClosures: DEFAULT_CLUB_CLOSURES,
    groups: [
      {
        id: 'grp-senior-perf',
        name: 'Senior Performance',
        description: 'National & regional qualifiers — high-intensity aerobic & race pace',
        coach: 'Coach Sarah Jenkins',
        color: 'cyan',
        swimmers: [
          { id: 'sw-1', name: 'Alex Rivera', age: 17, gender: 'M', pb50m: '24.10', pb100m: '52.40', notes: 'Strong underwater kick' },
          { id: 'sw-2', name: 'Sam Chen', age: 16, gender: 'M', pb50m: '25.30', pb100m: '55.80', notes: 'Distance specialist' },
          { id: 'sw-3', name: 'Jordan Taylor', age: 18, gender: 'F', pb50m: '27.80', pb100m: '59.50', notes: 'Fast tempo' },
          { id: 'sw-4', name: 'Taylor Brooks', age: 17, gender: 'F', pb50m: '26.20', pb100m: '56.90', notes: 'Threshold specialist' },
          { id: 'sw-5', name: 'Riley Kim', age: 16, gender: 'M', pb50m: '29.40', pb100m: '1:04.20', notes: 'Watch pullout timing' },
          { id: 'sw-6', name: 'Jamie Patel', age: 17, gender: 'F', pb50m: '27.10', pb100m: '58.30', notes: 'Smooth transitions' }
        ]
      },
      {
        id: 'grp-age-group-gold',
        name: 'Age Group Gold',
        description: 'County & regional age group swimmers (13–15 yrs)',
        coach: 'Coach Marcus Vance',
        color: 'teal',
        swimmers: [
          { id: 'sw-7', name: 'Morgan Vance', age: 14, gender: 'F', pb50m: '28.10', pb100m: '1:01.00', notes: '' },
          { id: 'sw-8', name: 'Avery Lin', age: 15, gender: 'F', pb50m: '29.00', pb100m: '1:03.50', notes: '' },
          { id: 'sw-9', name: 'Quinn Reyes', age: 14, gender: 'M', pb50m: '28.90', pb100m: '1:02.40', notes: '' },
          { id: 'sw-10', name: 'Devon Price', age: 15, gender: 'M', pb50m: '27.40', pb100m: '59.80', notes: '' },
          { id: 'sw-11', name: 'Skyler Diaz', age: 13, gender: 'F', pb50m: '32.10', pb100m: '1:10.20', notes: '' },
          { id: 'sw-12', name: 'Peyton Cruz', age: 14, gender: 'M', pb50m: '29.50', pb100m: '1:04.80', notes: '' }
        ]
      },
      {
        id: 'grp-junior-dev',
        name: 'Junior Development',
        description: 'Stroke technique, turns & aerobic foundation (10–12 yrs)',
        coach: 'Coach Elena Rostova',
        color: 'amber',
        swimmers: [
          { id: 'sw-13', name: 'Hayden Ross', age: 12, gender: 'M', pb50m: '31.20', pb100m: '1:08.50', notes: '' },
          { id: 'sw-14', name: 'Emerson Cole', age: 11, gender: 'F', pb50m: '33.40', pb100m: '1:12.00', notes: '' },
          { id: 'sw-15', name: 'Finley Shaw', age: 12, gender: 'M', pb50m: '35.80', pb100m: '1:18.20', notes: '' },
          { id: 'sw-16', name: 'Dakota West', age: 11, gender: 'F', pb50m: '34.10', pb100m: '1:15.40', notes: '' },
          { id: 'sw-17', name: 'Charlie Park', age: 10, gender: 'M', pb50m: '34.90', pb100m: '1:16.10', notes: '' },
          { id: 'sw-18', name: 'Blake Woods', age: 12, gender: 'F', pb50m: '32.70', pb100m: '1:11.30', notes: '' }
        ]
      },
      {
        id: 'grp-masters',
        name: 'Masters Fitness',
        description: 'Adult competitive & triathlon conditioning squad',
        coach: 'Coach David Sterling',
        color: 'violet',
        swimmers: [
          { id: 'sw-19', name: 'Logan Reed', age: 34, gender: 'M', pb50m: '26.80', pb100m: '58.90', notes: 'Triathlete' },
          { id: 'sw-20', name: 'Tatum Hayes', age: 29, gender: 'F', pb50m: '28.50', pb100m: '1:02.10', notes: 'Open water' },
          { id: 'sw-21', name: 'Parker Webb', age: 42, gender: 'M', pb50m: '31.90', pb100m: '1:09.80', notes: '' }
        ]
      }
    ]
  };
}
