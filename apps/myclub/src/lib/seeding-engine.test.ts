import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSpearheadLaneOrder,
  seedCyclicPrelims,
  seedTimedFinals,
  type SeedingSwimmer,
} from "./seeding-engine";

describe("seeding-engine", () => {
  it("resolves standard spearhead lane order for 6 and 8 lane pools", () => {
    // 6 lanes: 3, 4, 2, 5, 1, 6
    assert.deepEqual(getSpearheadLaneOrder(6), [3, 4, 2, 5, 1, 6]);

    // 8 lanes: 4, 5, 3, 6, 2, 7, 1, 8
    assert.deepEqual(getSpearheadLaneOrder(8), [4, 5, 3, 6, 2, 7, 1, 8]);

    // 10 lanes: 5, 6, 4, 7, 3, 8, 2, 9, 1, 10
    assert.deepEqual(getSpearheadLaneOrder(10), [5, 6, 4, 7, 3, 8, 2, 9, 1, 10]);
  });

  it("seeds timed finals placing fastest seed in center lane of final heat", () => {
    const swimmers: SeedingSwimmer[] = [
      { swimmerId: "s1", swimmerName: "Alex", seedTimeMs: 62000 },
      { swimmerId: "s2", swimmerName: "Beth", seedTimeMs: 59000 }, // Fastest overall
      { swimmerId: "s3", swimmerName: "Charlie", seedTimeMs: 65000 },
      { swimmerId: "s4", swimmerName: "Dana", seedTimeMs: 61000 },
      { swimmerId: "s5", swimmerName: "Evan", seedTimeMs: 70000 },
      { swimmerId: "s6", swimmerName: "Fiona", seedTimeMs: 68000 },
      { swimmerId: "s7", swimmerName: "George", seedTimeMs: 63000 },
      { swimmerId: "s8", swimmerName: "Hannah", seedTimeMs: 60000 },
      { swimmerId: "s9", swimmerName: "Ian", seedTimeMs: 75000 }, // Slowest
    ];

    // In an 8-lane pool, 9 swimmers requires 2 heats
    const heats = seedTimedFinals(swimmers, 8);
    assert.equal(heats.length, 2);

    // Heat 1 contains the slower swimmers
    // Heat 2 contains the fastest swimmers, with Beth (59.00s) in lane 4
    const finalHeat = heats[1];
    const lane4 = finalHeat.lanes.find((l) => l.laneNumber === 4);
    assert.ok(lane4);
    assert.equal(lane4.swimmerName, "Beth");
    assert.equal(lane4.seedTimeMs, 59000);

    // Second fastest (Hannah 60.00s) should be in lane 5 of final heat
    const lane5 = finalHeat.lanes.find((l) => l.laneNumber === 5);
    assert.ok(lane5);
    assert.equal(lane5.swimmerName, "Hannah");
    assert.equal(lane5.seedTimeMs, 60000);
  });

  it("handles No Time (NT) entries gracefully by seeding them in early heats", () => {
    const swimmers: SeedingSwimmer[] = [
      { swimmerId: "s1", swimmerName: "Fast Swimmer", seedTimeMs: 28000 },
      { swimmerId: "s2", swimmerName: "New Swimmer", seedTimeMs: null }, // NT
      { swimmerId: "s3", swimmerName: "Mid Swimmer", seedTimeMs: 32000 },
    ];

    const heats = seedTimedFinals(swimmers, 6);
    assert.equal(heats.length, 1);
    const lane3 = heats[0].lanes.find((l) => l.laneNumber === 3);
    assert.equal(lane3?.swimmerName, "Fast Swimmer");

    const ntLane = heats[0].lanes.find((l) => l.swimmerName === "New Swimmer");
    assert.equal(ntLane?.seedTimeFormatted, "NT");
  });

  it("seeds cyclic prelims distributing top 3 seeds across 3 heats", () => {
    // Generate 24 swimmers to fill 3 heats of 8
    const swimmers: SeedingSwimmer[] = Array.from({ length: 24 }, (_, idx) => ({
      swimmerId: `sw-${idx + 1}`,
      swimmerName: `Swimmer ${idx + 1}`,
      seedTimeMs: 30000 + idx * 500, // sw-1: 30.0s, sw-2: 30.5s, sw-3: 31.0s
    }));

    const heats = seedCyclicPrelims(swimmers, 8);
    assert.equal(heats.length, 3);

    // Top 3 seeds should each be in lane 4 of their respective heat
    const heat1Lane4 = heats[0].lanes.find((l) => l.laneNumber === 4);
    const heat2Lane4 = heats[1].lanes.find((l) => l.laneNumber === 4);
    const heat3Lane4 = heats[2].lanes.find((l) => l.laneNumber === 4);

    assert.ok(heat1Lane4);
    assert.ok(heat2Lane4);
    assert.ok(heat3Lane4);

    // Seeds 1, 2, 3 distributed
    const topNames = new Set([heat1Lane4.swimmerName, heat2Lane4.swimmerName, heat3Lane4.swimmerName]);
    assert.ok(topNames.has("Swimmer 1"));
    assert.ok(topNames.has("Swimmer 2"));
    assert.ok(topNames.has("Swimmer 3"));
  });

  it("returns empty heats array when no swimmers are provided", () => {
    assert.deepEqual(seedTimedFinals([], 8), []);
    assert.deepEqual(seedCyclicPrelims([], 8), []);
  });
});

