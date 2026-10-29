import type { Gender, PoolCourse, SwimStroke } from "@deckgala/database";

export type StandardLevel = "COUNTY" | "REGIONAL" | "NATIONAL";

export type StandardStatus = "ACHIEVED" | "WITHIN_REACH" | "TARGET";

export interface TimeStandard {
  stroke: SwimStroke;
  distance: number;
  course: PoolCourse;
  gender: Gender;
  minAge: number;
  maxAge: number;
  level: StandardLevel;
  cutTimeMs: number;
}

export interface StandardEvaluation {
  level: StandardLevel;
  cutTimeMs: number;
  cutFormatted: string;
  pbTimeMs: number;
  pbFormatted: string;
  status: StandardStatus;
  deltaMs: number;
  deltaFormatted: string;
}

/**
 * Formats milliseconds into standardized swimming tabular time strings:
 * e.g. 28140 -> "28.14", 61420 -> "1:01.42", 134200 -> "2:14.20"
 */
export function formatSwimTime(timeMs: number | null | undefined): string {
  if (timeMs == null || Number.isNaN(timeMs) || timeMs <= 0) {
    return "NT";
  }

  const totalHundredths = Math.round(timeMs / 10);
  const hundredths = totalHundredths % 100;
  const totalSeconds = Math.floor(totalHundredths / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const hundredthsStr = hundredths.toString().padStart(2, "0");

  if (minutes > 0) {
    const secondsStr = seconds.toString().padStart(2, "0");
    return `${minutes}:${secondsStr}.${hundredthsStr}`;
  }

  return `${seconds}.${hundredthsStr}`;
}

/**
 * Parses swimming time string e.g. "1:01.42" or "28.14" to milliseconds.
 */
export function parseSwimTimeToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "NT") return null;

  const colonParts = trimmed.split(":");
  if (colonParts.length === 2) {
    const minutes = Number.parseInt(colonParts[0], 10);
    const secParts = colonParts[1].split(".");
    const seconds = Number.parseInt(secParts[0], 10);
    const hundredths = secParts[1] ? Number.parseInt(secParts[1].padEnd(2, "0").slice(0, 2), 10) : 0;
    if (Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(hundredths)) return null;
    return (minutes * 60 + seconds) * 1000 + hundredths * 10;
  }

  if (colonParts.length === 1) {
    const secParts = colonParts[0].split(".");
    const seconds = Number.parseInt(secParts[0], 10);
    const hundredths = secParts[1] ? Number.parseInt(secParts[1].padEnd(2, "0").slice(0, 2), 10) : 0;
    if (Number.isNaN(seconds) || Number.isNaN(hundredths)) return null;
    return seconds * 1000 + hundredths * 10;
  }

  return null;
}

/**
 * Built-in representative standard qualifying cut tables (Swim England County / Regional / National).
 * These can also be augmented from database or JSON files.
 */
export const DEFAULT_QUALIFYING_STANDARDS: TimeStandard[] = [
  // Boys 13-14 25m Short Course
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "COUNTY", cutTimeMs: 29500 },
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "REGIONAL", cutTimeMs: 27800 },
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "NATIONAL", cutTimeMs: 25900 },

  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "COUNTY", cutTimeMs: 64500 },
  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "REGIONAL", cutTimeMs: 60200 },
  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "NATIONAL", cutTimeMs: 56800 },

  { stroke: "BACKSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "COUNTY", cutTimeMs: 73000 },
  { stroke: "BACKSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "REGIONAL", cutTimeMs: 68500 },
  { stroke: "BACKSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "NATIONAL", cutTimeMs: 64000 },

  { stroke: "BREASTSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "COUNTY", cutTimeMs: 83500 },
  { stroke: "BREASTSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "REGIONAL", cutTimeMs: 78500 },
  { stroke: "BREASTSTROKE", distance: 100, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "NATIONAL", cutTimeMs: 72000 },

  { stroke: "BUTTERFLY", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "COUNTY", cutTimeMs: 32500 },
  { stroke: "BUTTERFLY", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "REGIONAL", cutTimeMs: 30500 },
  { stroke: "BUTTERFLY", distance: 50, course: "SHORT_COURSE_METERS", gender: "MALE", minAge: 13, maxAge: 14, level: "NATIONAL", cutTimeMs: 28200 },

  // Girls 11-12 25m Short Course
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "COUNTY", cutTimeMs: 32000 },
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "REGIONAL", cutTimeMs: 30100 },
  { stroke: "FREESTYLE", distance: 50, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "NATIONAL", cutTimeMs: 28500 },

  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "COUNTY", cutTimeMs: 71000 },
  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "REGIONAL", cutTimeMs: 66000 },
  { stroke: "FREESTYLE", distance: 100, course: "SHORT_COURSE_METERS", gender: "FEMALE", minAge: 11, maxAge: 12, level: "NATIONAL", cutTimeMs: 62000 },
];

/**
 * Finds the applicable standards for an event matching the swimmer's age and gender.
 */
export function getStandardsForEvent(
  stroke: SwimStroke,
  distance: number,
  course: PoolCourse,
  gender: Gender,
  age: number,
  standards: TimeStandard[] = DEFAULT_QUALIFYING_STANDARDS,
): TimeStandard[] {
  return standards.filter(
    (std) =>
      std.stroke === stroke &&
      std.distance === distance &&
      std.course === course &&
      (std.gender === gender || std.gender === "OPEN") &&
      age >= std.minAge &&
      age <= std.maxAge,
  );
}

/**
 * Evaluates a swimmer's personal best against a specific standard cut.
 */
export function evaluateTimeAgainstStandard(
  pbTimeMs: number,
  standard: TimeStandard,
): StandardEvaluation {
  const deltaMs = pbTimeMs - standard.cutTimeMs;
  const isAchieved = deltaMs <= 0;

  // Within reach if within 1.5s or <= 2.5% of cut
  const isWithinReach = !isAchieved && (deltaMs <= 1500 || deltaMs / standard.cutTimeMs <= 0.025);

  let status: StandardStatus = "TARGET";
  if (isAchieved) {
    status = "ACHIEVED";
  } else if (isWithinReach) {
    status = "WITHIN_REACH";
  }

  const deltaFormatted = isAchieved
    ? `-${formatSwimTime(Math.abs(deltaMs))}`
    : `+${formatSwimTime(deltaMs)}`;

  return {
    level: standard.level,
    cutTimeMs: standard.cutTimeMs,
    cutFormatted: formatSwimTime(standard.cutTimeMs),
    pbTimeMs,
    pbFormatted: formatSwimTime(pbTimeMs),
    status,
    deltaMs,
    deltaFormatted,
  };
}

/**
 * Summarizes total championship qualification counts across a swimmer's personal bests.
 */
export function calculateSwimmerChampionshipSummary(
  pbs: Array<{ stroke: SwimStroke; distance: number; course: PoolCourse; timeMs: number }>,
  gender: Gender,
  age: number,
  standards: TimeStandard[] = DEFAULT_QUALIFYING_STANDARDS,
): { countyCount: number; regionalCount: number; nationalCount: number } {
  let countyCount = 0;
  let regionalCount = 0;
  let nationalCount = 0;

  for (const pb of pbs) {
    const applicable = getStandardsForEvent(pb.stroke, pb.distance, pb.course, gender, age, standards);
    for (const std of applicable) {
      if (pb.timeMs <= std.cutTimeMs) {
        if (std.level === "COUNTY") countyCount++;
        if (std.level === "REGIONAL") regionalCount++;
        if (std.level === "NATIONAL") nationalCount++;
      }
    }
  }

  return { countyCount, regionalCount, nationalCount };
}

