import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canCreateClub, parseFreeClubLimit } from "./plan-policy";

describe("club plan policy", () => {
  it("defaults to one free club and accepts a managed zero allowance", () => {
    assert.equal(parseFreeClubLimit(undefined), 1);
    assert.equal(parseFreeClubLimit("0"), 0);
    assert.equal(parseFreeClubLimit("4"), 4);
  });

  it("rejects malformed or out-of-range allowances", () => {
    assert.throws(() => parseFreeClubLimit("-1"));
    assert.throws(() => parseFreeClubLimit("1.5"));
    assert.throws(() => parseFreeClubLimit("1001"));
  });

  it("requires a subscription only after the account reaches its allowance", () => {
    assert.equal(canCreateClub(0, 1, null), true);
    assert.equal(canCreateClub(1, 1, null), false);
    assert.equal(canCreateClub(1, 1, "active"), true);
    assert.equal(canCreateClub(1, 1, "trialing"), true);
    assert.equal(canCreateClub(1, 1, "past_due"), false);
  });
});
