import type { GroupColor, PoolCourse } from '../types';

export const STORAGE_KEY = 'aquapace_club_swim_v1';

export const GROUP_COLORS: { id: GroupColor; label: string }[] = [
  { id: 'cyan', label: 'Cyan' },
  { id: 'teal', label: 'Teal' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
  { id: 'violet', label: 'Violet' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'blue', label: 'Blue' }
];

export const SET_PRESETS: string[] = [
  '10 x 100m Freestyle',
  '8 x 50m Kick Build',
  '12 x 50m Drill / Swim',
  '6 x 200m Threshold',
  '16 x 25m Sprint Breakout',
  '4 x 100m IM Order'
];

export const POOL_COURSES: { value: PoolCourse; label: string }[] = [
  { value: '25m', label: '25m (Short Course)' },
  { value: '50m', label: '50m (Long Course)' },
  { value: '25y', label: '25y (Yards)' }
];

