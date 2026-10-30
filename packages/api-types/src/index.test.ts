import { describe, expect, test } from "bun:test";
import {
  authRedirectTargetSchema,
  crossSubdomainSessionSchema,
  disqualificationEventSchema,
  laneTouchEventSchema,
  parentSwimmerLinkInputSchema,
  pushSubscriptionInputSchema,
  pwaGalaEntrySchema,
  startGunEventSchema,
  syncPayloadSchema,
  trainingScheduleInputSchema,
  webSocketEventSchema,
} from "./index";

const eventBase = {
  eventId: "event-1",
  galaId: "gala-1",
  occurredAt: "2026-10-28T20:00:00.000Z",
  sourceDeviceId: "device-1",
};

describe("syncPayloadSchema", () => {
  test("accepts a versioned offline session upload", () => {
    const payload = {
      version: 1,
      clubId: "club-1",
      deviceId: "device-1",
      syncedAt: "2026-10-28T20:00:00.000Z",
      sessions: [{
        id: "session-1",
        name: "Evening training",
        startedAt: "2026-10-28T18:00:00.000Z",
        results: [{
          id: "result-1",
          timestamp: "2026-10-28T18:10:00.000Z",
          sessionName: "Evening training",
          sessionDate: "2026-10-28",
          sessionTime: "18:10",
          setName: "10 x 100m freestyle",
          lane: 1,
          swimmer: "Alex Morgan",
          wave: 1,
          rep: 1,
          netTimeMs: 62340,
          finishWallMs: 62340,
          targetTimeSec: 65,
        }],
      }],
    };

    expect(syncPayloadSchema.safeParse(payload).success).toBe(true);
    expect(syncPayloadSchema.safeParse({ ...payload, version: 2 }).success).toBe(false);
    expect(syncPayloadSchema.safeParse({
      ...payload,
      sessions: [{
        ...payload.sessions[0],
        results: [{ ...payload.sessions[0].results[0], lane: 0 }],
      }],
    }).success).toBe(false);
  });
});

describe("webSocketEventSchema", () => {
  test("accepts each supported real-time event", () => {
    expect(startGunEventSchema.safeParse({
      ...eventBase,
      type: "start_gun",
      eventNumber: 1,
      heat: 2,
    }).success).toBe(true);
    expect(laneTouchEventSchema.safeParse({
      ...eventBase,
      type: "lane_touch",
      lane: 4,
      elapsedMs: 62340,
    }).success).toBe(true);
    expect(disqualificationEventSchema.safeParse({
      ...eventBase,
      type: "disqualification",
      lane: 4,
      infractionCode: "15M_UNDERWATER",
    }).success).toBe(true);
  });

  test("rejects malformed or unknown event messages", () => {
    expect(webSocketEventSchema.safeParse({
      ...eventBase,
      type: "lane_touch",
      lane: 0,
      elapsedMs: -1,
    }).success).toBe(false);
    expect(webSocketEventSchema.safeParse({
      ...eventBase,
      type: "unknown_event",
    }).success).toBe(false);
  });
});

describe("Phase 5: Centralized Auth & Redirection Schemas", () => {
  test("validates cross-subdomain session claims", () => {
    const validSession = {
      token: "sess_abc123",
      userId: "user_456",
      email: "headcoach@aquatics.org",
      name: "Coach Sarah",
      activeClubId: "club_xyz",
      roles: ["COACH", "ADMIN"],
      isStaff: true,
      expiresAt: "2026-10-31T12:00:00.000Z",
    };
    expect(crossSubdomainSessionSchema.safeParse(validSession).success).toBe(true);

    const invalidSession = {
      ...validSession,
      email: "invalid-email",
    };
    expect(crossSubdomainSessionSchema.safeParse(invalidSession).success).toBe(false);
  });

  test("validates auth redirection target", () => {
    const validTarget = {
      targetUrl: "https://myclub.deckgala.com/dashboard",
      portal: "MYCLUB",
      reason: "Verified Staff Session",
    };
    expect(authRedirectTargetSchema.safeParse(validTarget).success).toBe(true);
  });
});

describe("Phase 5: Family & Training Schemas", () => {
  test("validates parent-swimmer link payload with defaults", () => {
    const parsed = parentSwimmerLinkInputSchema.parse({
      swimmerId: "swimmer_1",
    });
    expect(parsed.relationship).toBe("GUARDIAN");
    expect(parsed.isPrimaryContact).toBe(true);
    expect(parsed.canEnterGalas).toBe(true);
  });

  test("validates training schedule payload", () => {
    const validSchedule = {
      clubId: "club_1",
      dayOfWeek: "TUESDAY",
      startTime: "18:00",
      endTime: "19:30",
      venueName: "Olympic Aquatics Centre",
      laneAllocation: "Lanes 1 to 4",
      coachName: "Head Coach David",
      drills: "Aerobic threshold + kick sets",
    };
    expect(trainingScheduleInputSchema.safeParse(validSchedule).success).toBe(true);

    // Invalid time format
    expect(trainingScheduleInputSchema.safeParse({
      ...validSchedule,
      startTime: "6pm",
    }).success).toBe(false);
  });

  test("validates PWA gala entry submissions", () => {
    const validEntry = {
      galaId: "gala_1",
      swimmerId: "swimmer_1",
      events: [
        { eventId: "ev_1", seedTimeMs: 28450, allowNoTime: false },
        { eventId: "ev_2", allowNoTime: true },
      ],
      paymentMethod: "POOL_DESK",
      notes: "First gala of the season",
    };
    expect(pwaGalaEntrySchema.safeParse(validEntry).success).toBe(true);

    // Must have at least 1 event
    expect(pwaGalaEntrySchema.safeParse({
      ...validEntry,
      events: [],
    }).success).toBe(false);
  });

  test("validates Web Push subscription payload", () => {
    const validSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
      p256dh: "BM6h_key_abc",
      auth: "auth_token_xyz",
      userAgent: "Mozilla/5.0 PWA",
    };
    expect(pushSubscriptionInputSchema.safeParse(validSub).success).toBe(true);
  });
});
