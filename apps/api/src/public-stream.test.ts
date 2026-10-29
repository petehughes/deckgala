import { describe, expect, it } from "bun:test";
import { PublicEventStreams } from "./public-stream";

const startEvent = {
  eventId: "start-1",
  galaId: "gala-1",
  occurredAt: "2026-10-29T07:00:00Z",
  sourceDeviceId: "device-1",
  type: "start_gun" as const,
  eventNumber: 3,
  heat: 2,
};

const touchEvent = {
  eventId: "touch-1",
  galaId: "gala-1",
  occurredAt: "2026-10-29T07:00:30Z",
  sourceDeviceId: "device-1",
  type: "lane_touch" as const,
  lane: 4,
  elapsedMs: 30_125,
};

async function readFrame(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const { value } = await reader.read();
  return new TextDecoder().decode(value);
}

describe("public gala event streams", () => {
  it("streams validated relay events using SSE frames", async () => {
    const streams = new PublicEventStreams();
    const response = streams.createResponse("gala-1");
    const reader = response.body!.getReader();
    expect(await readFrame(reader)).toBe(": connected\n\n");

    streams.publish(startEvent);
    expect(await readFrame(reader)).toContain(JSON.stringify(startEvent));
    streams.publish(touchEvent);
    expect(await readFrame(reader)).toContain(JSON.stringify(touchEvent));
    await reader.cancel();
    expect(streams.hasCapacity("gala-1")).toBe(true);
  });

  it("replays the active heat and most recent lane touches to joining spectators", async () => {
    const streams = new PublicEventStreams();
    streams.publish(startEvent);
    streams.publish(touchEvent);

    const reader = streams.createResponse("gala-1").body!.getReader();
    expect(await readFrame(reader)).toBe(": connected\n\n");
    expect(await readFrame(reader)).toContain(JSON.stringify(startEvent));
    expect(await readFrame(reader)).toContain(JSON.stringify(touchEvent));
    await reader.cancel();
  });

  it("resets the lane snapshot when a new heat starts", async () => {
    const streams = new PublicEventStreams();
    streams.publish(startEvent);
    streams.publish(touchEvent);
    streams.publish({ ...startEvent, eventId: "start-2", heat: 3 });

    const reader = streams.createResponse("gala-1").body!.getReader();
    await readFrame(reader);
    const frame = await readFrame(reader);
    expect(frame).toContain('"heat":3');
    await reader.cancel();
  });

  it("limits simultaneous public spectators per gala", async () => {
    const streams = new PublicEventStreams(1);
    const reader = streams.createResponse("gala-1").body!.getReader();
    expect(streams.hasCapacity("gala-1")).toBe(false);
    await reader.cancel();
    expect(streams.hasCapacity("gala-1")).toBe(true);
  });
});
