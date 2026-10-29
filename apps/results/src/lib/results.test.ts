import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRaceTime, formatMeetDate } from "./results";

describe("public results formatting", () => {
  it("formats pool times to hundredths without number jitter", () => {
    assert.equal(formatRaceTime(62_349), "1:02.34");
    assert.equal(formatRaceTime(9_080), "0:09.08");
  });

  it("renders missing and invalid times explicitly", () => {
    assert.equal(formatRaceTime(null), "—");
    assert.equal(formatRaceTime(Number.NaN), "—");
    assert.equal(formatRaceTime(-1), "—");
  });

  it("formats meet dates consistently in UTC", () => {
    assert.equal(formatMeetDate("2026-10-29T23:30:00.000Z"), "Oct 29, 2026");
  });
});
