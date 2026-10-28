import { describe, expect, test } from "bun:test";
import {
  disqualificationEventSchema,
  laneTouchEventSchema,
  startGunEventSchema,
  syncPayloadSchema,
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
