export type PoolCourse = "SHORT_COURSE_METERS" | "LONG_COURSE_METERS" | "SHORT_COURSE_YARDS";
export type SwimStroke = "FREESTYLE" | "BACKSTROKE" | "BREASTSTROKE" | "BUTTERFLY" | "INDIVIDUAL_MEDLEY";

/**
 * Standard turn factors (seconds per turn) according to Swim England equivalent tables
 */
const TURN_FACTORS: Record<SwimStroke, number> = {
  FREESTYLE: 0.8,
  BACKSTROKE: 0.8,
  BREASTSTROKE: 1.0,
  BUTTERFLY: 0.7,
  INDIVIDUAL_MEDLEY: 0.8,
};

/**
 * Converts swimming times between Short Course Meters (SCM 25m) and Long Course Meters (LCM 50m).
 * Uses standard turn differential modeling based on the Swim England Equivalent Tables.
 *
 * SCM to LCM: LCM has fewer turns (1 turn per 50m in SCM vs 0 in 50m LCM). Fewer turns generally means slower times (+time).
 * LCM to SCM: SCM has more turns, with push-off momentum speeding up the swim (-time).
 */
export function convertPoolCourseTime(
  timeMs: number,
  stroke: SwimStroke,
  distance: number,
  fromCourse: PoolCourse,
  toCourse: PoolCourse,
): number {
  if (fromCourse === toCourse || timeMs <= 0) return timeMs;

  const turnFactor = TURN_FACTORS[stroke] ?? 0.8;
  const num50s = Math.max(1, distance / 50);

  // Turn difference: in a 25m pool there are (distance/25 - 1) turns. In a 50m pool there are (distance/50 - 1) turns.
  // The turn count difference is: (2 * num50s - 1) - (num50s - 1) = num50s turns!
  // Each additional turn in 25m saves approximately turnFactor seconds.
  const turnDiffMs = Math.round(num50s * turnFactor * 1000);

  if (fromCourse === "SHORT_COURSE_METERS" && toCourse === "LONG_COURSE_METERS") {
    return timeMs + turnDiffMs;
  }

  if (fromCourse === "LONG_COURSE_METERS" && toCourse === "SHORT_COURSE_METERS") {
    return Math.max(0, timeMs - turnDiffMs);
  }

  // SCM <-> SCY conversions (1m = 1.09361 yd, ratio ~ 0.8927 + turns)
  if (fromCourse === "SHORT_COURSE_METERS" && toCourse === "SHORT_COURSE_YARDS") {
    return Math.round(timeMs * 0.8929);
  }

  if (fromCourse === "SHORT_COURSE_YARDS" && toCourse === "SHORT_COURSE_METERS") {
    return Math.round(timeMs / 0.8929);
  }

  if (fromCourse === "LONG_COURSE_METERS" && toCourse === "SHORT_COURSE_YARDS") {
    const scm = convertPoolCourseTime(timeMs, stroke, distance, "LONG_COURSE_METERS", "SHORT_COURSE_METERS");
    return convertPoolCourseTime(scm, stroke, distance, "SHORT_COURSE_METERS", "SHORT_COURSE_YARDS");
  }

  if (fromCourse === "SHORT_COURSE_YARDS" && toCourse === "LONG_COURSE_METERS") {
    const scm = convertPoolCourseTime(timeMs, stroke, distance, "SHORT_COURSE_YARDS", "SHORT_COURSE_METERS");
    return convertPoolCourseTime(scm, stroke, distance, "SHORT_COURSE_METERS", "LONG_COURSE_METERS");
  }

  return timeMs;
}

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

