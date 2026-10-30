import type { Gender, PoolCourse, SwimStroke } from "@aquateamhub/database";

export interface SwimEnglandRankedTime {
  stroke: SwimStroke;
  distance: number;
  course: PoolCourse;
  timeMs: number;
  achievedAt: string;
  meetName: string;
}

export interface SwimEnglandMemberDetails {
  governingBodyId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  category: "Category 1: Club Train" | "Category 2: Club Compete" | "Category 3: Club Support";
  status: "ACTIVE" | "LAPSED" | "EXPIRED";
  primaryClub: string;
  rankedTimes: SwimEnglandRankedTime[];
  lastSyncedAt: string;
}

export interface BatchSyncSummary {
  totalRequested: number;
  syncedCount: number;
  unverifiedCount: number;
  results: Array<{
    swimmerId: string;
    governingBodyId: string;
    success: boolean;
    data?: SwimEnglandMemberDetails;
    error?: string;
  }>;
}

export interface ClubSyncAuditReport extends BatchSyncSummary {
  expiredCount: number;
  category1CompetitorCount: number;
  discrepancyCount: number;
}

/**
 * Deterministic mock generator for local development and offline environments
 * when SWIM_ENGLAND_API_KEY is not configured.
 */
function getMockSwimEnglandDetails(governingBodyId: string): SwimEnglandMemberDetails {
  const isFemale = governingBodyId.endsWith("2") || governingBodyId.endsWith("4") || governingBodyId.endsWith("6");
  const isExpired = governingBodyId.startsWith("99");
  const isCategory1 = governingBodyId.endsWith("1");

  return {
    governingBodyId,
    firstName: isFemale ? "Mia" : "Alex",
    lastName: "Morgan",
    dateOfBirth: "2013-05-14",
    gender: isFemale ? "FEMALE" : "MALE",
    category: isCategory1 ? "Category 1: Club Train" : "Category 2: Club Compete",
    status: isExpired ? "EXPIRED" : "ACTIVE",
    primaryClub: "AquaTeamHub Swimming Club",
    rankedTimes: [
      {
        stroke: "FREESTYLE",
        distance: 50,
        course: "SHORT_COURSE_METERS",
        timeMs: 28140,
        achievedAt: "2026-03-15",
        meetName: "Spring County Qualifier",
      },
      {
        stroke: "FREESTYLE",
        distance: 100,
        course: "SHORT_COURSE_METERS",
        timeMs: 61420,
        achievedAt: "2026-04-10",
        meetName: "Regional Sprint Meet",
      },
      {
        stroke: "BUTTERFLY",
        distance: 50,
        course: "SHORT_COURSE_METERS",
        timeMs: 30150,
        achievedAt: "2026-02-28",
        meetName: "Club Championships",
      },
    ],
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Fetches member registration details and verified times from the official Swim England API.
 */
export async function fetchSwimEnglandMemberDetails(
  governingBodyId: string,
): Promise<SwimEnglandMemberDetails | null> {
  const normalizedId = governingBodyId.trim();
  if (!normalizedId) return null;

  const apiKey = process.env.SWIM_ENGLAND_API_KEY;
  const baseUrl = process.env.SWIM_ENGLAND_API_URL || "https://api-membership.swimming.org";

  // Use mock provider in development or when API key is omitted
  if (!apiKey || process.env.NODE_ENV === "test") {
    return getMockSwimEnglandDetails(normalizedId);
  }

  try {
    const response = await fetch(`${baseUrl}/v1/MemberDetails/${encodeURIComponent(normalizedId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Swim England API responded with status ${response.status}`);
    }

    const payload = await response.json();
    return {
      governingBodyId: payload.memberNumber || normalizedId,
      firstName: payload.forename || "",
      lastName: payload.surname || "",
      dateOfBirth: payload.dateOfBirth?.slice(0, 10) || "2000-01-01",
      gender: payload.gender === "Female" ? "FEMALE" : "MALE",
      category: payload.categoryDescription || "Category 2: Club Compete",
      status: payload.membershipStatus === "Active" ? "ACTIVE" : "EXPIRED",
      primaryClub: payload.clubName || "Unknown Club",
      rankedTimes: payload.personalBests || [],
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`Swim England API lookup failed for ID ${normalizedId}:`, error);
    // Fall back to mock if error occurs in development
    if (process.env.NODE_ENV === "development") {
      return getMockSwimEnglandDetails(normalizedId);
    }
    throw error;
  }
}

/**
 * Batch syncs an entire squad of swimmers.
 */
export async function batchSyncSquadMembers(
  members: Array<{ id: string; governingBodyId: string }>,
): Promise<BatchSyncSummary> {
  const results: BatchSyncSummary["results"] = [];

  for (const member of members) {
    try {
      const details = await fetchSwimEnglandMemberDetails(member.governingBodyId);
      if (details) {
        results.push({
          swimmerId: member.id,
          governingBodyId: member.governingBodyId,
          success: true,
          data: details,
        });
      } else {
        results.push({
          swimmerId: member.id,
          governingBodyId: member.governingBodyId,
          success: false,
          error: "Member number not found in Swim England registry",
        });
      }
    } catch (err) {
      results.push({
        swimmerId: member.id,
        governingBodyId: member.governingBodyId,
        success: false,
        error: err instanceof Error ? err.message : "Sync error",
      });
    }
  }

  const syncedCount = results.filter((r) => r.success).length;
  return {
    totalRequested: members.length,
    syncedCount,
    unverifiedCount: members.length - syncedCount,
    results,
  };
}

/**
 * Batch syncs the entire club roster and generates a compliance audit report.
 */
export async function batchSyncClubMembers(
  members: Array<{ id: string; governingBodyId: string; registeredDob?: string }>,
): Promise<ClubSyncAuditReport> {
  const squadSummary = await batchSyncSquadMembers(members);

  let expiredCount = 0;
  let category1CompetitorCount = 0;
  let discrepancyCount = 0;

  for (const res of squadSummary.results) {
    if (res.success && res.data) {
      if (res.data.status !== "ACTIVE") {
        expiredCount++;
      }
      if (res.data.category === "Category 1: Club Train") {
        category1CompetitorCount++;
      }
      const memberInput = members.find((m) => m.id === res.swimmerId);
      if (memberInput?.registeredDob && memberInput.registeredDob !== res.data.dateOfBirth) {
        discrepancyCount++;
      }
    }
  }

  return {
    ...squadSummary,
    expiredCount,
    category1CompetitorCount,
    discrepancyCount,
  };
}

