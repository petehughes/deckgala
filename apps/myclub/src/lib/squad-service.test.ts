import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSquadPerformance,
  findCoachingOpportunities,
  isPromotionDue,
} from "./squad-service";

describe("squad-service", () => {
  const mockSwimmers = [
    {
      id: "swimmer-1",
      firstName: "Alex",
      lastName: "Morgan",
      gender: "MALE" as const,
      dateOfBirth: new Date("2013-05-14T00:00:00Z"), // Age 13 in 2026
      personalBests: [
        { stroke: "FREESTYLE" as const, distance: 50, course: "SHORT_COURSE_METERS" as const, timeMs: 28500 }, // County cut is 29.50 (Achieved)
        { stroke: "BREASTSTROKE" as const, distance: 100, course: "SHORT_COURSE_METERS" as const, timeMs: 78900 }, // Regional cut is 78.50 -> +0.40s (Within reach)
      ],
    },
    {
      id: "swimmer-2",
      firstName: "Lucas",
      lastName: "Davies",
      gender: "MALE" as const,
      dateOfBirth: new Date("2013-08-20T00:00:00Z"), // Age 13 in 2026
      personalBests: [
        { stroke: "BREASTSTROKE" as const, distance: 100, course: "SHORT_COURSE_METERS" as const, timeMs: 79100 }, // Regional cut is 78.50 -> +0.60s (Within reach)
      ],
    },
    {
      id: "swimmer-3",
      firstName: "Ethan",
      lastName: "Evans",
      gender: "MALE" as const,
      dateOfBirth: new Date("2013-02-10T00:00:00Z"), // Age 13 in 2026
      personalBests: [
        { stroke: "BREASTSTROKE" as const, distance: 100, course: "SHORT_COURSE_METERS" as const, timeMs: 78800 }, // Regional cut is 78.50 -> +0.30s (Within reach)
      ],
    },
  ];

  it("identifies clustered coaching opportunities with actionable recommendations", () => {
    const opportunities = findCoachingOpportunities(mockSwimmers);
    assert.ok(opportunities.length > 0);

    // 100m Breaststroke should be top opportunity with 3 swimmers clustered
    const breastOpp = opportunities.find(
      (o) => o.stroke === "BREASTSTROKE" && o.distance === 100 && o.level === "REGIONAL",
    );
    assert.ok(breastOpp);
    assert.equal(breastOpp.clusterCount, 3);
    assert.equal(breastOpp.swimmers.length, 3);
    assert.ok(breastOpp.coachingRecommendation.includes("pullout"));
    // Closest swimmer should be first (+0.30s Ethan)
    assert.equal(breastOpp.swimmers[0].swimmerName, "Ethan Evans");
  });

  it("calculates aggregate squad performance and standards tally", () => {
    const summary = calculateSquadPerformance("Senior Performance", mockSwimmers);
    assert.equal(summary.squadName, "Senior Performance");
    assert.equal(summary.totalSwimmers, 3);
    assert.equal(summary.standardsTally.FREESTYLE.county, 1);
    assert.ok(summary.topOpportunities.length > 0);
  });

  it("checks if scheduled promotion is due based on effective date", () => {
    const pastDate = "2026-01-01";
    const futureDate = "2027-05-01";
    const ref = new Date("2026-10-29T12:00:00Z");

    assert.equal(isPromotionDue(pastDate, ref), true);
    assert.equal(isPromotionDue(futureDate, ref), false);
  });
});

