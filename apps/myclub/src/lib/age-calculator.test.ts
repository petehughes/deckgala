import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCompetitionAge, resolveStandardAgeGroup } from "./age-calculator";

describe("age-calculator", () => {
  it("calculates age as of Dec 31 according to British Swimming / Swim England rules", () => {
    const dob = new Date("2013-11-20T00:00:00Z");
    const meetDate = new Date("2026-04-15T00:00:00Z");

    const age = calculateCompetitionAge(dob, meetDate, "AGE_DEC_31");
    assert.equal(age, 13);
  });

  it("calculates age on the day of meet accurately", () => {
    const dob = new Date("2013-11-20T00:00:00Z");
    const beforeBday = new Date("2026-04-15T00:00:00Z");
    assert.equal(calculateCompetitionAge(dob, beforeBday, "AGE_DAY_OF_MEET"), 12);

    const afterBday = new Date("2026-11-21T00:00:00Z");
    assert.equal(calculateCompetitionAge(dob, afterBday, "AGE_DAY_OF_MEET"), 13);
  });

  it("resolves competitive age groups", () => {
    assert.equal(resolveStandardAgeGroup(10), "9-10");
    assert.equal(resolveStandardAgeGroup(11), "11-12");
    assert.equal(resolveStandardAgeGroup(13), "13-14");
    assert.equal(resolveStandardAgeGroup(15), "15-16");
    assert.equal(resolveStandardAgeGroup(18), "17 & Over");
  });
});
