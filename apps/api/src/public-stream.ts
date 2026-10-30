import type { WebSocketEvent } from "@aquateamhub/api-types";

type StartGunEvent = Extract<WebSocketEvent, { type: "start_gun" }>;

interface GalaLiveState {
  start: StartGunEvent | null;
  lanes: Map<number, WebSocketEvent>;
  updatedAt: number;
  subscribers: Set<ReadableStreamDefaultController<Uint8Array>>;
  cleanups: Map<ReadableStreamDefaultController<Uint8Array>, () => void>;
}

export class PublicEventStreams {
  private readonly rooms = new Map<string, GalaLiveState>();

  constructor(
    private readonly maxSubscribersPerGala = 500,
    private readonly maxTrackedGalas = 500,
    private readonly staleAfterMs = 12 * 60 * 60 * 1000,
  ) {}

  hasCapacity(galaId: string): boolean {
    return (this.getState(galaId)?.subscribers.size ?? 0) < this.maxSubscribersPerGala;
  }

  createResponse(galaId: string): Response {
    let activeController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        activeController = controller;
        const state = this.getOrCreateState(galaId);
        state.subscribers.add(controller);
        controller.enqueue(encodeFrame(": connected\n\n"));
        if (state.start) {
          controller.enqueue(encodeFrame(state.start));
          for (const laneEvent of state.lanes.values()) {
            controller.enqueue(encodeFrame(laneEvent));
          }
        }

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encodeFrame(": keep-alive\n\n"));
          } catch {
            this.removeSubscriber(galaId, controller);
          }
        }, 25_000);
        state.cleanups.set(controller, () => clearInterval(heartbeat));
      },
      cancel: () => {
        if (activeController) this.removeSubscriber(galaId, activeController);
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  publish(event: WebSocketEvent): void {
    const state = event.type === "start_gun"
      ? this.getOrCreateState(event.galaId)
      : this.getState(event.galaId);
    if (!state) return;

    if (event.type === "start_gun") {
      state.start = event;
      state.lanes.clear();
    } else if (state.start) {
      state.lanes.set(event.lane, event);
    }
    state.updatedAt = Date.now();

    const frame = encodeFrame(event);
    for (const subscriber of state.subscribers) {
      try {
        subscriber.enqueue(frame);
      } catch {
        this.removeSubscriber(event.galaId, subscriber);
      }
    }
  }

  private getState(galaId: string): GalaLiveState | undefined {
    const state = this.rooms.get(galaId);
    if (state && state.subscribers.size === 0 && Date.now() - state.updatedAt > this.staleAfterMs) {
      this.rooms.delete(galaId);
      return undefined;
    }
    return state;
  }

  private getOrCreateState(galaId: string): GalaLiveState {
    const current = this.getState(galaId);
    if (current) return current;

    while (this.rooms.size >= this.maxTrackedGalas) {
      const oldest = this.rooms.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      const oldestState = this.rooms.get(oldest);
      if (oldestState) {
        for (const controller of oldestState.subscribers) {
          oldestState.cleanups.get(controller)?.();
          try {
            controller.close();
          } catch {
            oldestState.subscribers.delete(controller);
          }
        }
      }
      this.rooms.delete(oldest);
    }

    const state: GalaLiveState = {
      start: null,
      lanes: new Map(),
      updatedAt: Date.now(),
      subscribers: new Set(),
      cleanups: new Map(),
    };
    this.rooms.set(galaId, state);
    return state;
  }

  private removeSubscriber(
    galaId: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ): void {
    const state = this.rooms.get(galaId);
    if (!state) return;
    state.cleanups.get(controller)?.();
    state.cleanups.delete(controller);
    state.subscribers.delete(controller);
  }
}

function encodeFrame(value: unknown): Uint8Array {
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }
  return new TextEncoder().encode(`event: gala-event\ndata: ${JSON.stringify(value)}\n\n`);
}
