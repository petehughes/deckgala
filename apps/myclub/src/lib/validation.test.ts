import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assignSwimmerSquadSchema,
  galaFormSchema,
  galaVisibilitySchema,
  invitationFormSchema,
  memberFormSchema,
  parseUtcDateTime,
  renewalFormSchema,
  squadFormSchema,
  updateMemberFormSchema,
  updateSquadFormSchema,
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

  it("validates update member form with memberId, email, phone and Swim England ID", () => {
    const updated = updateMemberFormSchema.parse({
      memberId: "mem-123",
      firstName: "Alex",
      lastName: "Morgan",
      email: "alex.new@example.com",
      phone: "07700900123",
      governingBodyId: "1482931",
      emergencyContactName: "Sarah Morgan",
      emergencyContactPhone: "07700900456",
      dateOfBirth: "2013-05-14",
      gender: "MALE",
      squad: "National Squad",
    });

    assert.equal(updated.memberId, "mem-123");
    assert.equal(updated.email, "alex.new@example.com");
    assert.equal(updated.phone, "07700900123");
    assert.equal(updated.governingBodyId, "1482931");
    assert.equal(updated.squad, "National Squad");
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

  it("validates squad creation form", () => {
    const valid = squadFormSchema.parse({
      name: "Senior Performance",
      description: "National and Regional qualifier squad",
      coachName: "Coach Dave",
      schedule: "Mon/Wed/Fri 17:30-19:30",
    });

    assert.equal(valid.name, "Senior Performance");
    assert.equal(valid.coachName, "Coach Dave");
    assert.equal(valid.schedule, "Mon/Wed/Fri 17:30-19:30");

    assert.equal(squadFormSchema.safeParse({ name: "" }).success, false);
  });

  it("validates squad update and swimmer assignment forms", () => {
    const updated = updateSquadFormSchema.parse({
      squadId: "sq-123",
      name: "Junior Academy",
      description: "",
      coachName: "",
      schedule: "",
    });

    assert.equal(updated.squadId, "sq-123");
    assert.equal(updated.name, "Junior Academy");
    assert.equal(updated.description, null);

    const assigned = assignSwimmerSquadSchema.parse({
      swimmerId: "swim-123",
      squadId: "sq-123",
    });
    assert.equal(assigned.swimmerId, "swim-123");
    assert.equal(assigned.squadId, "sq-123");

    const unassigned = assignSwimmerSquadSchema.parse({
      swimmerId: "swim-123",
      squadId: "",
    });
    assert.equal(unassigned.squadId, null);
  });
});
