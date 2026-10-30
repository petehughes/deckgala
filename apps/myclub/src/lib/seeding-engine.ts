import type { PoolCourse, SwimStroke } from "@deckgala/database";
import { formatSwimTime } from "./qualifying-standards";

export interface SeedingSwimmer {
  swimmerId: string;
  swimmerName: string;
  clubName?: string;
  seedTimeMs: number | null; // null represents No Time (NT)
}

export interface SeededLaneAssignment {
  laneNumber: number;
  swimmerId: string;
  swimmerName: string;
  clubName?: string;
  seedTimeMs: number | null;
  seedTimeFormatted: string;
}

export interface SeededHeat {
  heatNumber: number;
  totalHeats: number;
  lanes: SeededLaneAssignment[];
}

export interface SeededEventProgram {
  eventId: string;
  eventNumber: number;
  eventName: string;
  stroke: SwimStroke;
  distance: number;
  course: PoolCourse;
  poolLanes: number;
  totalEntries: number;
  heats: SeededHeat[];
}

/**
 * Returns the standard spearhead lane order for an N-lane competition pool
 * according to World Aquatics / Swim England technical rules.
 * Fastest swimmer is placed in the center lane (e.g. lane 4 in an 8-lane pool).
 */
export function getSpearheadLaneOrder(poolLanes: number): number[] {
  if (poolLanes <= 0) return [1];

  switch (poolLanes) {
    case 4:
      return [2, 3, 1, 4];
    case 5:
      return [3, 4, 2, 5, 1];
    case 6:
      return [3, 4, 2, 5, 1, 6];
    case 8:
      return [4, 5, 3, 6, 2, 7, 1, 8];
    case 10:
      return [5, 6, 4, 7, 3, 8, 2, 9, 1, 10];
    default: {
      const center = Math.ceil(poolLanes / 2);
      const order: number[] = [center];
      let step = 1;
      while (order.length < poolLanes) {
        if (center + step <= poolLanes) order.push(center + step);
        if (center - step >= 1) order.push(center - step);
        step++;
      }
      return order;
    }
  }
}

/**
 * Seeds an event using standard Spearhead Timed-Final rules:
 * - Entries sorted from slowest to fastest (NT entries swim in early heats).
 * - Heats are arranged chronologically: Heat 1 is slowest, final heat is fastest.
 * - Swimmers within each heat are assigned lanes using the spearhead pattern.
 */
export function seedTimedFinals(
  swimmers: SeedingSwimmer[],
  poolLanes: number = 8,
): SeededHeat[] {
  if (swimmers.length === 0) return [];

  // Sort swimmers: swimmers with valid times sorted fastest first, NT (null) at the end
  const sorted = [...swimmers].sort((a, b) => {
    if (a.seedTimeMs === null && b.seedTimeMs === null) return 0;
    if (a.seedTimeMs === null) return 1;
    if (b.seedTimeMs === null) return -1;
    return a.seedTimeMs - b.seedTimeMs;
  });

  const laneOrder = getSpearheadLaneOrder(poolLanes);
  const totalHeats = Math.ceil(sorted.length / poolLanes);
  const heats: SeededHeat[] = [];

  // Calculate swimmers per heat (distributing evenly if early heats have fewer swimmers)
  let remainingSwimmers = sorted.length;
  let swimmerCursor = 0;

  // We assign fastest swimmers to the final heat, so we chunk backwards or compute slice sizes
  const heatSizes: number[] = [];
  for (let h = 0; h < totalHeats; h++) {
    const heatsRemaining = totalHeats - h;
    const size = Math.ceil(remainingSwimmers / heatsRemaining);
    heatSizes.push(size);
    remainingSwimmers -= size;
  }

  // Slower swimmers in earlier heats, so heat 1 gets the slowest slice
  // sorted is [fastest ... slowest], so reverse it for assignment
  const slowestToFastest = [...sorted].reverse();

  for (let heatIndex = 0; heatIndex < totalHeats; heatIndex++) {
    const heatNumber = heatIndex + 1;
    const heatSize = heatSizes[heatIndex];
    const heatSwimmers = slowestToFastest.slice(swimmerCursor, swimmerCursor + heatSize);
    swimmerCursor += heatSize;

    // Within this heat, sort swimmers fastest to slowest to map to spearhead lane order
    const heatFastestFirst = [...heatSwimmers].sort((a, b) => {
      if (a.seedTimeMs === null && b.seedTimeMs === null) return 0;
      if (a.seedTimeMs === null) return 1;
      if (b.seedTimeMs === null) return -1;
      return a.seedTimeMs - b.seedTimeMs;
    });

    const lanes: SeededLaneAssignment[] = [];
    for (let i = 0; i < heatFastestFirst.length; i++) {
      const swimmer = heatFastestFirst[i];
      const laneNumber = laneOrder[i];
      lanes.push({
        laneNumber,
        swimmerId: swimmer.swimmerId,
        swimmerName: swimmer.swimmerName,
        clubName: swimmer.clubName,
        seedTimeMs: swimmer.seedTimeMs,
        seedTimeFormatted: swimmer.seedTimeMs ? formatSwimTime(swimmer.seedTimeMs) : "NT",
      });
    }

    // Sort lanes numerically (Lane 1 through N) for poolside clipboard presentation
    lanes.sort((a, b) => a.laneNumber - b.laneNumber);

    heats.push({
      heatNumber,
      totalHeats,
      lanes,
    });
  }

  return heats;
}

/**
 * Seeds championship preliminary heats using Cyclic (Circle) seeding across
 * the top 2 or 3 heats, preventing a single prelim heat from stacking all top seeds.
 */
export function seedCyclicPrelims(
  swimmers: SeedingSwimmer[],
  poolLanes: number = 8,
): SeededHeat[] {
  if (swimmers.length <= poolLanes * 2) {
    // If 2 or fewer heats, standard spearhead timed final seeding is applied
    return seedTimedFinals(swimmers, poolLanes);
  }

  const sortedFastestFirst = [...swimmers].sort((a, b) => {
    if (a.seedTimeMs === null && b.seedTimeMs === null) return 0;
    if (a.seedTimeMs === null) return 1;
    if (b.seedTimeMs === null) return -1;
    return a.seedTimeMs - b.seedTimeMs;
  });

  const totalHeats = Math.ceil(sortedFastestFirst.length / poolLanes);
  const cycleHeatsCount = totalHeats >= 3 ? 3 : 2;
  const cycleSwimmersCount = cycleHeatsCount * poolLanes;

  const cyclicSwimmers = sortedFastestFirst.slice(0, cycleSwimmersCount);
  const remainingSwimmers = sortedFastestFirst.slice(cycleSwimmersCount);

  // Seed earlier heats with remaining slower swimmers
  const baseHeats = seedTimedFinals(remainingSwimmers, poolLanes);

  // Distribute cyclic swimmers round-robin across the final heats
  const finalHeatBuckets: SeedingSwimmer[][] = Array.from(
    { length: cycleHeatsCount },
    () => [],
  );

  for (let i = 0; i < cyclicSwimmers.length; i++) {
    const bucketIndex = i % cycleHeatsCount;
    finalHeatBuckets[bucketIndex].push(cyclicSwimmers[i]);
  }

  const laneOrder = getSpearheadLaneOrder(poolLanes);
  const cyclicHeats: SeededHeat[] = [];

  for (let i = 0; i < cycleHeatsCount; i++) {
    const heatNumber = baseHeats.length + i + 1;
    const bucket = finalHeatBuckets[i];
    const lanes: SeededLaneAssignment[] = [];

    for (let j = 0; j < bucket.length; j++) {
      const swimmer = bucket[j];
      const laneNumber = laneOrder[j];
      lanes.push({
        laneNumber,
        swimmerId: swimmer.swimmerId,
        swimmerName: swimmer.swimmerName,
        clubName: swimmer.clubName,
        seedTimeMs: swimmer.seedTimeMs,
        seedTimeFormatted: swimmer.seedTimeMs ? formatSwimTime(swimmer.seedTimeMs) : "NT",
      });
    }

    lanes.sort((a, b) => a.laneNumber - b.laneNumber);
    cyclicHeats.push({
      heatNumber,
      totalHeats,
      lanes,
    });
  }

  // Update totalHeats count on base heats
  const allHeats = [...baseHeats, ...cyclicHeats].map((h, idx) => ({
    ...h,
    heatNumber: idx + 1,
    totalHeats: baseHeats.length + cyclicHeats.length,
  }));

  return allHeats;
}

