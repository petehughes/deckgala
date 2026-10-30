import { PrismaClient } from "@aquateamhub/database";
import {
  syncPayloadSchema,
  webSocketEventSchema,
  type SyncPayload,
} from "@aquateamhub/api-types";
import type { Server, ServerWebSocket } from "bun";
import { PublicEventStreams } from "./public-stream";

const maxSyncBodyBytes = 10 * 1024 * 1024;
const prisma = new PrismaClient();
const relayRooms = new Map<string, Set<ServerWebSocket<RelayConnection>>>();
const publicStreams = new PublicEventStreams();

interface RelayConnection {
  galaId: string;
  isPublic: boolean;
}

interface ApiDependencies {
  findRelayGala(galaId: string): Promise<{ isPublic: boolean } | null>;
}

const defaultDependencies: ApiDependencies = {
  findRelayGala: (galaId) => prisma.gala.findUnique({
    where: { id: galaId },
    select: { isPublic: true },
  }),
};

function response(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function corsResponse(request: Request, data: unknown, status = 200): Response {
  const result = response(data, status);
  const configuredOrigin = Bun.env.CORS_ORIGIN?.trim();
  const origin = request.headers.get("origin");
  result.headers.set("Access-Control-Allow-Origin", configuredOrigin || "*");
  if (origin) {
    result.headers.set("Vary", "Origin");
  }
  return result;
}

function attachCorsHeaders(request: Request, result: Response): Response {
  const configuredOrigin = Bun.env.CORS_ORIGIN?.trim();
  const origin = request.headers.get("origin");
  result.headers.set("Access-Control-Allow-Origin", configuredOrigin || "*");
  if (origin) result.headers.set("Vary", "Origin");
  return result;
}

function hasApiToken(request: Request): boolean {
  const token = Bun.env.API_BEARER_TOKEN;
  const authorization = request.headers.get("authorization");
  const websocketProtocols = request.headers.get("sec-websocket-protocol")?.split(",").map((protocol) => protocol.trim());
  return Boolean(
    token
    && (authorization === `Bearer ${token}` || websocketProtocols?.includes(`deckgala.bearer.${token}`)),
  );
}

async function saveSyncPayload(payload: SyncPayload): Promise<number> {
  return prisma.$transaction(async (transaction) => {
    const club = await transaction.club.findUnique({
      where: { id: payload.clubId },
      select: { id: true },
    });

    if (!club) {
      throw new SyncClubNotFoundError();
    }

    let resultCount = 0;
    for (const session of payload.sessions) {
      const deckSession = await transaction.deckSession.upsert({
        where: {
          clubId_clientId: {
            clubId: payload.clubId,
            clientId: session.id,
          },
        },
        create: {
          clubId: payload.clubId,
          clientId: session.id,
          name: session.name,
          startedAt: new Date(session.startedAt),
          endedAt: session.endedAt ? new Date(session.endedAt) : null,
        },
        update: {
          name: session.name,
          startedAt: new Date(session.startedAt),
          endedAt: session.endedAt ? new Date(session.endedAt) : null,
        },
        select: { id: true },
      });

      for (const result of session.results) {
        await transaction.raceResult.upsert({
          where: {
            deckSessionId_clientId: {
              deckSessionId: deckSession.id,
              clientId: result.id,
            },
          },
          create: {
            deckSessionId: deckSession.id,
            clientId: result.id,
            swimmerName: result.swimmer,
            lane: result.lane,
            heat: result.wave,
            timeMs: result.netTimeMs,
            recordedAt: new Date(result.timestamp),
            sessionDate: new Date(`${result.sessionDate}T00:00:00.000Z`),
            sessionTime: result.sessionTime,
            setName: result.setName,
            rep: result.rep,
            targetTimeSec: result.targetTimeSec,
            finishWallMs: result.finishWallMs,
          },
          update: {
            swimmerName: result.swimmer,
            lane: result.lane,
            heat: result.wave,
            timeMs: result.netTimeMs,
            recordedAt: new Date(result.timestamp),
            sessionDate: new Date(`${result.sessionDate}T00:00:00.000Z`),
            sessionTime: result.sessionTime,
            setName: result.setName,
            rep: result.rep,
            targetTimeSec: result.targetTimeSec,
            finishWallMs: result.finishWallMs,
          },
        });
        resultCount += 1;
      }
    }

    return resultCount;
  });
}

class SyncClubNotFoundError extends Error {}
class SyncBodyTooLargeError extends Error {}

async function readLimitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    return "";
  }
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxSyncBodyBytes) {
      await reader.cancel();
      throw new SyncBodyTooLargeError();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function handleRequest(
  request: Request,
  server?: Pick<Server<RelayConnection>, "upgrade">,
  dependencies: ApiDependencies = defaultDependencies,
): Promise<Response> {
  const url = new URL(request.url);
  const configuredOrigin = Bun.env.CORS_ORIGIN?.trim();
  const origin = request.headers.get("origin");
  if (origin && configuredOrigin && configuredOrigin !== "*" && origin !== configuredOrigin) {
    return corsResponse(request, { error: "Origin is not allowed" }, 403);
  }

  if (request.method === "OPTIONS" && url.pathname === "/api/v1/sync") {
    const result = new Response(null, { status: 204 });
    result.headers.set("Access-Control-Allow-Origin", configuredOrigin || "*");
    result.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    result.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    result.headers.set("Access-Control-Max-Age", "600");
    if (origin) {
      result.headers.set("Vary", "Origin");
    }
    return result;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return corsResponse(request, { status: "ok" });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/public/galas") {
    try {
      const galas = await prisma.gala.findMany({
        where: { isPublic: true },
        orderBy: { startsAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          venue: true,
          course: true,
          startsAt: true,
          endsAt: true,
          club: { select: { name: true } },
          _count: { select: { events: true } },
        },
      });
      return corsResponse(request, { data: galas });
    } catch (error) {
      console.error("Failed to load public galas", error);
      return corsResponse(request, { error: "Failed to load public galas" }, 500);
    }
  }

  const publicGalaRoute = /^\/api\/v1\/public\/galas\/([^/]+)(?:\/(stream))?$/.exec(url.pathname);
  if (request.method === "GET" && publicGalaRoute) {
    let galaId: string;
    try {
      galaId = decodeURIComponent(publicGalaRoute[1] ?? "");
    } catch {
      return corsResponse(request, { error: "Invalid gala ID" }, 400);
    }
    if (!galaId || galaId.length > 128) {
      return corsResponse(request, { error: "Invalid gala ID" }, 400);
    }
    try {
      const gala = await prisma.gala.findFirst({
        where: { id: galaId, isPublic: true },
        select: { id: true },
      });
      if (!gala) {
        return corsResponse(request, { error: "Public gala not found" }, 404);
      }

      if (publicGalaRoute[2] === "stream") {
        if (!publicStreams.hasCapacity(galaId)) {
          return corsResponse(request, { error: "Public stream has reached its subscriber limit" }, 429);
        }
        return attachCorsHeaders(request, publicStreams.createResponse(galaId));
      }

      const details = await prisma.gala.findUnique({
        where: { id: galaId },
        select: {
          id: true,
          name: true,
          venue: true,
          course: true,
          startsAt: true,
          endsAt: true,
          club: { select: { name: true } },
          events: {
            orderBy: { eventNumber: "asc" },
            select: {
              id: true,
              eventNumber: true,
              name: true,
              distance: true,
              stroke: true,
              gender: true,
              ageGroup: true,
              results: {
                orderBy: [{ heat: "asc" }, { lane: "asc" }, { recordedAt: "desc" }],
                take: 100,
                select: {
                  id: true,
                  swimmerName: true,
                  heat: true,
                  lane: true,
                  timeMs: true,
                  status: true,
                  infractionCode: true,
                  recordedAt: true,
                  splits: {
                    orderBy: { splitNumber: "asc" },
                    select: { splitNumber: true, distance: true, timeMs: true },
                  },
                },
              },
            },
          },
        },
      });
      return corsResponse(request, { data: details });
    } catch (error) {
      console.error("Failed to load public gala", error);
      return corsResponse(request, { error: "Failed to load public gala" }, 500);
    }
  }

  if (request.method === "POST" && url.pathname === "/api/v1/sync") {
    if (!Bun.env.API_BEARER_TOKEN) {
      return corsResponse(request, { error: "API_BEARER_TOKEN is not configured" }, 503);
    }
    if (!hasApiToken(request)) {
      return corsResponse(request, { error: "Unauthorized" }, 401);
    }

    let body: string;
    try {
      body = await readLimitedBody(request);
    } catch (error) {
      if (error instanceof SyncBodyTooLargeError) {
        return corsResponse(request, { error: "Request body exceeds the 10 MB limit" }, 413);
      }
      throw error;
    }

    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return corsResponse(request, { error: "Request body must be valid JSON" }, 400);
    }

    const parsed = syncPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return corsResponse(request, { error: "Invalid sync payload", issues: parsed.error.issues }, 400);
    }

    try {
      const resultCount = await saveSyncPayload(parsed.data);
      return corsResponse(request, { data: { sessions: parsed.data.sessions.length, results: resultCount } });
    } catch (error) {
      if (error instanceof SyncClubNotFoundError) {
        return corsResponse(request, { error: "Club not found" }, 404);
      }
      console.error("Failed to persist sync payload", error);
      return corsResponse(request, { error: "Failed to persist sync payload" }, 500);
    }
  }

  if (request.method === "GET" && url.pathname === "/api/v1/relay") {
    if (!Bun.env.API_BEARER_TOKEN) {
      return corsResponse(request, { error: "API_BEARER_TOKEN is not configured" }, 503);
    }
    if (!hasApiToken(request)) {
      return corsResponse(request, { error: "Unauthorized" }, 401);
    }
    const galaId = url.searchParams.get("galaId")?.trim();
    if (!galaId || galaId.length > 128) {
      return corsResponse(request, { error: "A valid galaId query parameter is required" }, 400);
    }
    const websocketProtocols = request.headers.get("sec-websocket-protocol")
      ?.split(",")
      .map((protocol) => protocol.trim());
    let relayGala: { isPublic: boolean } | null;
    try {
      relayGala = await dependencies.findRelayGala(galaId);
    } catch (error) {
      console.error("Failed to load relay gala", error);
      return corsResponse(request, { error: "Failed to load relay gala" }, 500);
    }
    if (!relayGala) {
      return corsResponse(request, { error: "Gala not found" }, 404);
    }
    const upgradeOptions = {
      data: { galaId, isPublic: relayGala.isPublic },
      ...(websocketProtocols?.includes("deckgala.v1")
        ? { headers: { "Sec-WebSocket-Protocol": "deckgala.v1" } }
        : {}),
    };
    if (!server?.upgrade(request, upgradeOptions)) {
      return corsResponse(request, { error: "WebSocket upgrade failed" }, 400);
    }
    return new Response(null);
  }

  return corsResponse(request, { error: "Not found" }, 404);
}

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  Bun.serve<RelayConnection>({
    port,
    fetch: (request, server) => handleRequest(request, server),
    websocket: {
      maxPayloadLength: 64 * 1024,
      open(socket) {
        const room = relayRooms.get(socket.data.galaId) ?? new Set();
        room.add(socket);
        relayRooms.set(socket.data.galaId, room);
      },
      message(socket, message) {
        let json: unknown;
        try {
          const text = typeof message === "string" ? message : new TextDecoder().decode(message);
          json = JSON.parse(text);
        } catch {
          socket.send(JSON.stringify({ error: "Message must be valid JSON" }));
          return;
        }

        const parsed = webSocketEventSchema.safeParse(json);
        if (!parsed.success) {
          socket.send(JSON.stringify({ error: "Invalid event", issues: parsed.error.issues }));
          return;
        }
        if (parsed.data.galaId !== socket.data.galaId) {
          socket.send(JSON.stringify({ error: "Event galaId does not match this relay room" }));
          return;
        }

        const serialized = JSON.stringify(parsed.data);
        for (const client of relayRooms.get(socket.data.galaId) ?? []) {
          if (client !== socket && client.readyState === 1) {
            client.send(serialized);
          }
        }
        if (socket.data.isPublic) publicStreams.publish(parsed.data);
      },
      close(socket) {
        const room = relayRooms.get(socket.data.galaId);
        room?.delete(socket);
        if (room?.size === 0) {
          relayRooms.delete(socket.data.galaId);
        }
      },
    },
  });

  console.info(`DeckGala API listening on port ${port}`);
}
