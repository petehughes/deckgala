import { uid } from './ids';
import type { Swimmer, SwimmerGroup, ClubData, RosterSort, Gender } from '../types';

export interface RosterFilterOptions {
  search?: string;
  sort?: RosterSort;
}

export function filterAndSortSwimmers(
  swimmers: Swimmer[] = [],
  { search = '', sort = { field: 'name', dir: 'asc' } }: RosterFilterOptions = {}
): Swimmer[] {
  const query = search.trim().toLowerCase();
  let list = [...swimmers];

  if (query) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.notes && s.notes.toLowerCase().includes(query))
    );
  }

  list.sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (sort.field === 'name') {
      return a.name.localeCompare(b.name) * dir;
    } else if (sort.field === 'age') {
      const ageA = typeof a.age === 'number' ? a.age : (parseInt(String(a.age), 10) || 0);
      const ageB = typeof b.age === 'number' ? b.age : (parseInt(String(b.age), 10) || 0);
      return (ageA - ageB) * dir;
    }
    return 0;
  });

  return list;
}

export function parseBulkSwimmersText(rawText: string): Swimmer[] {
  const lines = String(rawText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const added: Swimmer[] = [];

  lines.forEach(line => {
    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      if (!name) return;
      const ageVal = parts[1] ? parseInt(parts[1], 10) : '';
      const genderRaw = (parts[2] || '').toUpperCase();
      const gender: Gender = ['F', 'M', 'X'].includes(genderRaw) ? (genderRaw as Gender) : '';
      const pb50m = parts[3] || '';
      const pb100m = parts[4] || '';
      const notes = parts.slice(5).join(', ') || '';

      added.push({
        id: uid('sw'),
        name,
        age: !isNaN(Number(ageVal)) && ageVal !== '' ? Number(ageVal) : '',
        gender,
        pb50m,
        pb100m,
        notes
      });
    } else {
      added.push({
        id: uid('sw'),
        name: line,
        age: '',
        gender: '',
        pb50m: '',
        pb100m: '',
        notes: ''
      });
    }
  });

  return added;
}

export function getTotalClubSwimmersCount(club?: ClubData | null): number {
  if (!club || !Array.isArray(club.groups)) return 0;
  return club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
}

export function getActiveGroup(club: ClubData | null | undefined, activeGroupId: string | null): SwimmerGroup | null {
  if (!club || !Array.isArray(club.groups) || club.groups.length === 0) return null;
  return club.groups.find(g => g.id === activeGroupId) || club.groups[0];
}

