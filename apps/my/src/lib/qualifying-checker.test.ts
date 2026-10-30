import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkEventEligibility } from "./qualifying-checker";

describe("checkEventEligibility", () => {
  it("allows No Time when allowNoTime is true and no PB on file", () => {
    const res = checkEventEligibility(null, 32000, 28000, true);
    assert.equal(res.isEligible, true);
    assert.equal(res.status, "NO_TIME_ALLOWED");
  });

  it("rejects No Time when allowNoTime is false and no PB on file", () => {
    const res = checkEventEligibility(null, 32000, 28000, false);
    assert.equal(res.isEligible, false);
    assert.equal(res.status, "NO_TIME_NOT_ALLOWED");
  });

  it("qualifies swimmer when PB is faster than cut and slower than cutoff", () => {
    // Cut is 32.00s (32000ms), Cutoff is 28.00s (28000ms), Swimmer PB is 30.50s (30500ms)
    const res = checkEventEligibility(30500, 32000, 28000, true);
    assert.equal(res.isEligible, true);
    assert.equal(res.status, "QUALIFIED");
  });

  it("rejects swimmer who is too slow for the qualifying cut", () => {
    // Cut is 32.00s (32000ms), Swimmer PB is 34.20s (34200ms)
    const res = checkEventEligibility(34200, 32000, null, true);
    assert.equal(res.isEligible, false);
    assert.equal(res.status, "TOO_SLOW");
  });

  it("rejects swimmer who is faster than the cutoff limit (too fast)", () => {
    // Cutoff is 28.00s (28000ms), Swimmer PB is 27.50s (27500ms)
    const res = checkEventEligibility(27500, null, 28000, true);
    assert.equal(res.isEligible, false);
    assert.equal(res.status, "TOO_FAST");
  });
});

