import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSwimmerChampionshipSummary,
  evaluateTimeAgainstStandard,
  formatSwimTime,
  getStandardsForEvent,
  parseSwimTimeToMs,
} from "./qualifying-standards";

describe("qualifying-standards", () => {
  it("formats millisecond times into swim strings", () => {
    assert.equal(formatSwimTime(28140), "28.14");
    assert.equal(formatSwimTime(61420), "1:01.42");
    assert.equal(formatSwimTime(134200), "2:14.20");
    assert.equal(formatSwimTime(null), "NT");
  });

  it("parses swim strings into milliseconds", () => {
    assert.equal(parseSwimTimeToMs("28.14"), 28140);
    assert.equal(parseSwimTimeToMs("1:01.42"), 61420);
    assert.equal(parseSwimTimeToMs("2:14.20"), 134200);
    assert.equal(parseSwimTimeToMs("NT"), null);
  });

  it("evaluates a time against standard cuts", () => {
    const standards = getStandardsForEvent("FREESTYLE", 50, "SHORT_COURSE_METERS", "MALE", 13);
    const countyCut = standards.find((s) => s.level === "COUNTY");
    assert.ok(countyCut);

    const evalAchieved = evaluateTimeAgainstStandard(28140, countyCut);
    assert.equal(evalAchieved.status, "ACHIEVED");
    assert.ok(evalAchieved.deltaMs <= 0);

    const evalNear = evaluateTimeAgainstStandard(29900, countyCut);
    assert.equal(evalNear.status, "WITHIN_REACH");

    const evalTarget = evaluateTimeAgainstStandard(35000, countyCut);
    assert.equal(evalTarget.status, "TARGET");
  });

  it("calculates championship summary tally for a swimmer", () => {
    const pbs = [
      { stroke: "FREESTYLE" as const, distance: 50, course: "SHORT_COURSE_METERS" as const, timeMs: 27500 },
      { stroke: "FREESTYLE" as const, distance: 100, course: "SHORT_COURSE_METERS" as const, timeMs: 63000 },
    ];

    const summary = calculateSwimmerChampionshipSummary(pbs, "MALE", 13);
    assert.equal(summary.countyCount, 2);
    assert.equal(summary.regionalCount, 1);
    assert.equal(summary.nationalCount, 0);
  });
});
