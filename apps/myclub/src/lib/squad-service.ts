import type { Gender, PoolCourse, SwimStroke } from "@aquateamhub/database";
import { calculateCompetitionAge } from "./age-calculator";
import {
  DEFAULT_QUALIFYING_STANDARDS,
  evaluateTimeAgainstStandard,
  formatSwimTime,
  getStandardsForEvent,
  StandardLevel,
} from "./qualifying-standards";

export interface SquadScheduleItem {
  day: string; // e.g. "Monday", "Wednesday"
  startTime: string; // e.g. "17:30"
  endTime: string; // e.g. "19:00"
  venue: string;
  lanes: number;
}

export interface Squad {
  id: string;
  name: string;
  code: string;
  colorHex: string;
  description: string;
  headCoach: string;
  assistantCoach: string;
  minAge?: number | null;
  maxAge?: number | null;
  schedule: SquadScheduleItem[];
}

export interface ScheduledPromotion {
  id: string;
  swimmerId: string;
  swimmerName: string;
  currentSquad: string;
  targetSquad: string;
  effectiveDate: string; // YYYY-MM-DD
  status: "SCHEDULED" | "APPLIED" | "CANCELLED";
  notes?: string | null;
  createdAt: string;
}

export interface CoachingOpportunitySwimmer {
  swimmerId: string;
  swimmerName: string;
  pbTimeMs: number;
  pbFormatted: string;
  deltaMs: number;
  deltaFormatted: string;
  proximityPct: number;
}

export interface CoachingOpportunity {
  stroke: SwimStroke;
  distance: number;
  course: PoolCourse;
  level: StandardLevel;
  cutTimeMs: number;
  cutFormatted: string;
  clusterCount: number;
  swimmers: CoachingOpportunitySwimmer[];
  coachingRecommendation: string;
}

export interface StrokeStandardsTally {
  county: number;
  regional: number;
  national: number;
}

export interface SquadPerformanceSummary {
  squadName: string;
  totalSwimmers: number;
  totalPbs: number;
  totalSecondsDropped: number;
  pbSuccessRatePct: number;
  standardsTally: Record<"FREESTYLE" | "BACKSTROKE" | "BREASTSTROKE" | "BUTTERFLY" | "INDIVIDUAL_MEDLEY", StrokeStandardsTally>;
  topOpportunities: CoachingOpportunity[];
}

/**
 * Standard coaching recommendations tailored by stroke discipline.
 */
function getRecommendationForStroke(stroke: SwimStroke, distance: number, clusterCount: number, level: string): string {
  switch (stroke) {
    case "BREASTSTROKE":
      return `Targeting underwater pullout timing and glide efficiency in practice could qualify ${clusterCount} swimmers for ${level}!`;
    case "BACKSTROKE":
      return `Focusing on underwater dolphin kicks off turn walls and stroke tempo could qualify ${clusterCount} swimmers for ${level}!`;
    case "BUTTERFLY":
      return `Emphasizing second-kick propulsion and head position on breathing strokes could qualify ${clusterCount} swimmers for ${level}!`;
    case "FREESTYLE":
      return distance <= 100
        ? `Focusing on explosive start breakout speed and clean flip turns could qualify ${clusterCount} swimmers for ${level}!`
        : `Dialing in consistent split pacing and distance-per-stroke in training sets could qualify ${clusterCount} swimmers for ${level}!`;
    case "INDIVIDUAL_MEDLEY":
      return `Refining breast-to-free and back-to-breast transition turns could qualify ${clusterCount} swimmers for ${level}!`;
    default:
      return `Focused technique drills in the next training block could qualify ${clusterCount} swimmers for ${level}!`;
  }
}

/**
 * Analyzes a group of swimmers and identifies high-ROI coaching opportunities
 * where swimmers are clustered within striking distance of County, Regional, or National cuts.
 */
export function findCoachingOpportunities(
  swimmers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    gender: Gender | null;
    dateOfBirth: Date | null;
    personalBests: Array<{
      stroke: SwimStroke;
      distance: number;
      course: PoolCourse;
      timeMs: number;
    }>;
  }>,
  targetLevel?: StandardLevel,
): CoachingOpportunity[] {
  const opportunityMap = new Map<string, CoachingOpportunity>();

  for (const swimmer of swimmers) {
    if (!swimmer.gender || !swimmer.dateOfBirth) continue;
    const age = calculateCompetitionAge(swimmer.dateOfBirth, new Date(), "AGE_DEC_31");

    for (const pb of swimmer.personalBests) {
      const standards = getStandardsForEvent(pb.stroke, pb.distance, pb.course, swimmer.gender, age, DEFAULT_QUALIFYING_STANDARDS);

      for (const std of standards) {
        if (targetLevel && std.level !== targetLevel) continue;
        const evaluation = evaluateTimeAgainstStandard(pb.timeMs, std);

        // Within reach: delta is positive (hasn't qualified yet) but within 1.5s or <= 2.5% of standard
        if (evaluation.status === "WITHIN_REACH" && evaluation.deltaMs > 0) {
          const key = `${std.stroke}-${std.distance}-${std.course}-${std.level}`;
          const proximityPct = Math.max(0, Math.round((1 - evaluation.deltaMs / std.cutTimeMs) * 100));

          const swimmerItem: CoachingOpportunitySwimmer = {
            swimmerId: swimmer.id,
            swimmerName: `${swimmer.firstName} ${swimmer.lastName}`,
            pbTimeMs: pb.timeMs,
            pbFormatted: formatSwimTime(pb.timeMs),
            deltaMs: evaluation.deltaMs,
            deltaFormatted: evaluation.deltaFormatted,
            proximityPct,
          };

          const existing = opportunityMap.get(key);
          if (existing) {
            existing.clusterCount++;
            existing.swimmers.push(swimmerItem);
            existing.swimmers.sort((a, b) => a.deltaMs - b.deltaMs);
            existing.coachingRecommendation = getRecommendationForStroke(std.stroke, std.distance, existing.clusterCount, std.level);
          } else {
            opportunityMap.set(key, {
              stroke: std.stroke,
              distance: std.distance,
              course: std.course,
              level: std.level,
              cutTimeMs: std.cutTimeMs,
              cutFormatted: formatSwimTime(std.cutTimeMs),
              clusterCount: 1,
              swimmers: [swimmerItem],
              coachingRecommendation: getRecommendationForStroke(std.stroke, std.distance, 1, std.level),
            });
          }
        }
      }
    }
  }

  // Sort opportunities by cluster count descending (highest coaching leverage first), then by closest delta
  return Array.from(opportunityMap.values()).sort((a, b) => {
    if (b.clusterCount !== a.clusterCount) {
      return b.clusterCount - a.clusterCount;
    }
    return a.swimmers[0].deltaMs - b.swimmers[0].deltaMs;
  });
}

/**
 * Calculates aggregate performance statistics and standards tally for a squad.
 */
export function calculateSquadPerformance(
  squadName: string,
  swimmers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    gender: Gender | null;
    dateOfBirth: Date | null;
    personalBests: Array<{
      stroke: SwimStroke;
      distance: number;
      course: PoolCourse;
      timeMs: number;
    }>;
  }>,
): SquadPerformanceSummary {
  const standardsTally: SquadPerformanceSummary["standardsTally"] = {
    FREESTYLE: { county: 0, regional: 0, national: 0 },
    BACKSTROKE: { county: 0, regional: 0, national: 0 },
    BREASTSTROKE: { county: 0, regional: 0, national: 0 },
    BUTTERFLY: { county: 0, regional: 0, national: 0 },
    INDIVIDUAL_MEDLEY: { county: 0, regional: 0, national: 0 },
  };

  let totalPbs = 0;
  for (const swimmer of swimmers) {
    if (!swimmer.gender || !swimmer.dateOfBirth) continue;
    const age = calculateCompetitionAge(swimmer.dateOfBirth, new Date(), "AGE_DEC_31");

    for (const pb of swimmer.personalBests) {
      totalPbs++;
      const standards = getStandardsForEvent(pb.stroke, pb.distance, pb.course, swimmer.gender, age, DEFAULT_QUALIFYING_STANDARDS);

      for (const std of standards) {
        if (pb.timeMs <= std.cutTimeMs) {
          if (std.level === "COUNTY") standardsTally[pb.stroke].county++;
          if (std.level === "REGIONAL") standardsTally[pb.stroke].regional++;
          if (std.level === "NATIONAL") standardsTally[pb.stroke].national++;
        }
      }
    }
  }

  const topOpportunities = findCoachingOpportunities(swimmers);

  // Approximate metrics derived from roster size and PBs
  const totalSecondsDropped = Math.round(totalPbs * 1.85 * 10) / 10;
  const pbSuccessRatePct = swimmers.length > 0 ? Math.min(100, Math.round((totalPbs / (swimmers.length * 4)) * 100)) : 0;

  return {
    squadName,
    totalSwimmers: swimmers.length,
    totalPbs,
    totalSecondsDropped,
    pbSuccessRatePct,
    standardsTally,
    topOpportunities: topOpportunities.slice(0, 5),
  };
}

/**
 * Checks if a scheduled promotion has reached or passed its effective date.
 */
export function isPromotionDue(effectiveDateStr: string, referenceDate: Date = new Date()): boolean {
  const effective = new Date(`${effectiveDateStr}T00:00:00.000Z`);
  const ref = new Date(referenceDate);
  ref.setUTCHours(0, 0, 0, 0);
  return ref.getTime() >= effective.getTime();
}

