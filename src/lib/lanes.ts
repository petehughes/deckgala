import type { LaneConfig, ClubData, Swimmer } from '../types';

export function getSwimmerNamesForLane(laneCfg?: LaneConfig | null): string[] {
  if (!laneCfg || !laneCfg.swimmersText) return [];
  return laneCfg.swimmersText
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function createDefaultLanes(count: number = 6): LaneConfig[] {
  const sampleSquad: string[][] = [
    ['Alex Rivera', 'Sam Chen', 'Jordan Taylor', 'Casey Morgan'],
    ['Taylor Brooks', 'Riley Kim', 'Jamie Patel', 'Drew Bailey'],
    ['Morgan Vance', 'Avery Lin', 'Quinn Reyes', 'Cameron Bell'],
    ['Devon Price', 'Skyler Diaz', 'Peyton Cruz', 'Reese Grant'],
    ['Hayden Ross', 'Emerson Cole', 'Finley Shaw', 'Rowan Ellis'],
    ['Dakota West', 'charlie Park', 'Blake Woods', 'Sage Ortiz'],
    ['logan Reed', 'Tatum Hayes', 'Parker Webb', 'Sawyer Ford'],
    ['Harlow Dunn', 'remy Stone', 'Sutton Boyd', 'spencer Hart'],
    ['Lennox Mills', 'Milan Knight', 'keegan Rose', 'Arlo Lane'],
    ['Rory Palmer', 'Jude Holmes', 'Dallas Meyer', 'Zara Nash']
  ];

  const lanes: LaneConfig[] = [];
  for (let i = 1; i <= 10; i++) {
    const names = (sampleSquad[i - 1] || []).map(n =>
      n.replace(/\b\w/g, c => c.toUpperCase())
    );
    lanes.push({
      lane: i,
      interval: 5 + (i <= 2 ? 0 : 0),
      swimmersText: i <= count ? names.slice(0, 3).join('\n') : names.slice(0, 2).join('\n')
    });
  }
  return lanes;
}

export interface SessionSwimmerItem extends Swimmer {
  groupId: string;
  groupName: string;
  groupColor: string;
}

export function getSessionPoolSwimmers(club: ClubData | null | undefined, selectedGroupIds: string[] = []): SessionSwimmerItem[] {
  if (!club || !Array.isArray(club.groups)) return [];
  const selectedIds = new Set(selectedGroupIds);
  const list: SessionSwimmerItem[] = [];
  club.groups.forEach(g => {
    if (selectedIds.has(g.id)) {
      g.swimmers.forEach(s => {
        list.push({
          ...s,
          groupId: g.id,
          groupName: g.name,
          groupColor: g.color
        });
      });
    }
  });
  return list;
}

export function getAllAssignedLaneNamesSet(lanes: LaneConfig[] = [], laneCount: number = 6): Set<string> {
  const assigned = new Set<string>();
  for (let i = 0; i < laneCount; i++) {
    const lane = lanes[i];
    if (!lane) continue;
    getSwimmerNamesForLane(lane).forEach(n => assigned.add(n.toLowerCase()));
  }
  return assigned;
}

export function distributeSwimmersAcrossLanes(lanes: LaneConfig[], laneCount: number, poolSwimmers: { name: string }[]): LaneConfig[] {
  const buckets: string[][] = Array.from({ length: laneCount }, () => []);
  poolSwimmers.forEach((swimmer, idx) => {
    buckets[idx % laneCount].push(swimmer.name);
  });
  return lanes.map((lane, i) => {
    if (i < laneCount) {
      return { ...lane, swimmersText: buckets[i].join('\n') };
    }
    return lane;
  });
}

