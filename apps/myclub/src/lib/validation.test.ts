import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  galaFormSchema,
  galaVisibilitySchema,
  memberFormSchema,
  parseUtcDateTime,
  renewalFormSchema,
} from "./validation";

describe("club portal form validation", () => {
  it("trims member names and normalizes blank optional fields", () => {
    assert.deepEqual(memberFormSchema.parse({
      firstName: "  Alex ",
      lastName: " Lane ",
      email: "",
      phone: "",
      governingBodyId: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    }), {
      firstName: "Alex",
      lastName: "Lane",
      email: null,
      phone: null,
      governingBodyId: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
    });
  });

  it("rejects malformed member email addresses", () => {
    assert.equal(memberFormSchema.safeParse({
      firstName: "Alex",
      lastName: "Lane",
      email: "not-an-email",
      phone: "",
      governingBodyId: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    }).success, false);
  });

  it("accepts supported renewal dates and rejects invalid dates", () => {
    assert.equal(renewalFormSchema.safeParse({
      memberId: "member-1",
      membershipExpiresAt: "2027-10-29",
    }).success, true);
    assert.equal(renewalFormSchema.safeParse({
      memberId: "member-1",
      membershipExpiresAt: "2027-02-30",
    }).success, false);
  });

  it("supports explicitly publishing and unpublishing a gala", () => {
    assert.equal(galaVisibilitySchema.parse({ galaId: "gala-1", isPublic: "true" }).isPublic, true);
    assert.equal(galaVisibilitySchema.parse({ galaId: "gala-1", isPublic: "false" }).isPublic, false);
  });

  it("validates the meet form and interprets its schedule as UTC", () => {
    assert.equal(galaFormSchema.safeParse({
      name: "Autumn Gala",
      venue: "",
      course: "SHORT_COURSE_METERS",
      startsAt: "2026-10-29T09:30",
      endsAt: "",
      isPublic: true,
    }).success, true);
    assert.equal(parseUtcDateTime("2026-10-29T09:30").toISOString(), "2026-10-29T09:30:00.000Z");
  });
});
