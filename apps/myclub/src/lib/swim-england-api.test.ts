import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  batchSyncClubMembers,
  batchSyncSquadMembers,
  fetchSwimEnglandMemberDetails,
} from "./swim-england-api";

describe("swim-england-api", () => {
  it("fetches member details using the mock/development provider", async () => {
    const details = await fetchSwimEnglandMemberDetails("1482931");
    assert.ok(details);
    assert.equal(details.governingBodyId, "1482931");
    assert.equal(details.dateOfBirth, "2013-05-14");
    assert.equal(details.status, "ACTIVE");
    assert.ok(details.rankedTimes.length > 0);
  });

  it("performs batch squad synchronization", async () => {
    const squad = [
      { id: "swimmer-1", governingBodyId: "1482931" },
      { id: "swimmer-2", governingBodyId: "1482932" },
    ];

    const result = await batchSyncSquadMembers(squad);
    assert.equal(result.totalRequested, 2);
    assert.equal(result.syncedCount, 2);
    assert.equal(result.unverifiedCount, 0);
    assert.equal(result.results[0].data?.gender, "MALE");
    assert.equal(result.results[1].data?.gender, "FEMALE");
  });

  it("generates a club audit report flagging expired or training categories", async () => {
    const club = [
      { id: "swimmer-1", governingBodyId: "1482931", registeredDob: "2013-05-14" },
      { id: "swimmer-2", governingBodyId: "9912345", registeredDob: "2013-05-14" },
      { id: "swimmer-3", governingBodyId: "1482931", registeredDob: "2012-01-01" },
    ];

    const report = await batchSyncClubMembers(club);
    assert.equal(report.totalRequested, 3);
    assert.equal(report.expiredCount, 1);
    assert.equal(report.discrepancyCount, 1);
  });
});
