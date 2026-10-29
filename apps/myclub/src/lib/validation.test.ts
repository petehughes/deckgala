import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  galaFormSchema,
  galaVisibilitySchema,
  invitationFormSchema,
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
      dateOfBirth: "",
      gender: "",
      squad: "",
    }), {
      firstName: "Alex",
      lastName: "Lane",
      email: null,
      phone: null,
      governingBodyId: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      dateOfBirth: null,
      gender: null,
      squad: null,
      isSwimmer: true,
    });
  });

  it("parses valid swimmer fields including DOB, gender and squad", () => {
    const parsed = memberFormSchema.parse({
      firstName: "Mia",
      lastName: "Morgan",
      dateOfBirth: "2013-05-14",
      gender: "FEMALE",
      squad: "Senior Performance",
    });

    assert.equal(parsed.firstName, "Mia");
    assert.equal(parsed.dateOfBirth, "2013-05-14");
    assert.equal(parsed.gender, "FEMALE");
    assert.equal(parsed.squad, "Senior Performance");
    assert.equal(parsed.isSwimmer, true);
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
      membershipExpiresAt: "not-a-date",
    }).success, false);
  });

  it("supports explicitly publishing and unpublishing a gala", () => {
    assert.deepEqual(galaVisibilitySchema.parse({ galaId: "gala-1", isPublic: "true" }), {
      galaId: "gala-1",
      isPublic: true,
    });
    assert.deepEqual(galaVisibilitySchema.parse({ galaId: "gala-1", isPublic: "false" }), {
      galaId: "gala-1",
      isPublic: false,
    });
  });

  it("allows only non-admin roles through club invitation links", () => {
    assert.equal(invitationFormSchema.safeParse({ role: "ADMIN" }).success, false);
    assert.equal(invitationFormSchema.safeParse({ role: "COACH" }).success, true);
    assert.equal(invitationFormSchema.safeParse({ role: "TIMEKEEPER" }).success, true);
    assert.equal(invitationFormSchema.safeParse({ role: "PARENT" }).success, true);
  });

  it("validates the meet form and interprets its schedule as UTC", () => {
    assert.equal(galaFormSchema.safeParse({
      name: "Club Championships",
      venue: "",
      course: "SHORT_COURSE_METERS",
      startsAt: "2026-11-14T09:30",
      endsAt: "2026-11-14T17:00",
      isPublic: true,
    }).success, true);

    const parsedUtc = parseUtcDateTime("2026-11-14T09:30");
    assert.equal(parsedUtc.toISOString(), "2026-11-14T09:30:00.000Z");
  });
});
