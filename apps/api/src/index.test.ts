import { afterEach, describe, expect, it } from "bun:test";
import { handleRequest } from "./index";

const previousToken = Bun.env.API_BEARER_TOKEN;
const previousCorsOrigin = Bun.env.CORS_ORIGIN;

afterEach(() => {
  if (previousToken === undefined) {
    delete Bun.env.API_BEARER_TOKEN;
  } else {
    Bun.env.API_BEARER_TOKEN = previousToken;
  }
  if (previousCorsOrigin === undefined) {
    delete Bun.env.CORS_ORIGIN;
  } else {
    Bun.env.CORS_ORIGIN = previousCorsOrigin;
  }
});

describe("API request handling", () => {
  it("returns a health response without database configuration", async () => {
    const result = await handleRequest(new Request("http://localhost/health"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ status: "ok" });
  });

  it("requires a configured bearer token for sync", async () => {
    delete Bun.env.API_BEARER_TOKEN;
    const result = await handleRequest(new Request("http://localhost/api/v1/sync", {
      method: "POST",
      body: "{}",
    }));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: "API_BEARER_TOKEN is not configured" });
  });

  it("rejects sync requests with an invalid token", async () => {
    Bun.env.API_BEARER_TOKEN = "expected";
    const result = await handleRequest(new Request("http://localhost/api/v1/sync", {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
      body: "{}",
    }));
    expect(result.status).toBe(401);
  });

  it("reports invalid sync JSON without contacting the database", async () => {
    Bun.env.API_BEARER_TOKEN = "expected";
    const result = await handleRequest(new Request("http://localhost/api/v1/sync", {
      method: "POST",
      headers: { authorization: "Bearer expected" },
      body: "{",
    }));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "Request body must be valid JSON" });
  });

  it("requires a gala room for relay connections", async () => {
    Bun.env.API_BEARER_TOKEN = "expected";
    const result = await handleRequest(new Request("http://localhost/api/v1/relay", {
      headers: { authorization: "Bearer expected" },
    }));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({
      error: "A valid galaId query parameter is required",
    });
  });

  it("allows a browser sync preflight with the required headers", async () => {
    const result = await handleRequest(new Request("http://localhost/api/v1/sync", {
      method: "OPTIONS",
      headers: { origin: "https://club.example" },
    }));
    expect(result.status).toBe(204);
    expect(result.headers.get("access-control-allow-headers")).toBe("Authorization, Content-Type");
    expect(result.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("upgrades relay connections authenticated with browser WebSocket protocols", async () => {
    Bun.env.API_BEARER_TOKEN = "expected";
    const upgradeOptions: Array<{ data: { galaId: string; isPublic: boolean }; headers?: unknown }> = [];
    const upgrade = (_request: Request, options: { data: { galaId: string; isPublic: boolean }; headers?: unknown }) => {
      upgradeOptions.push(options);
      return true;
    };
    const result = await handleRequest(new Request("http://localhost/api/v1/relay?galaId=gala-1", {
      headers: { "sec-websocket-protocol": "deckgala.v1, deckgala.bearer.expected" },
    }), { upgrade }, {
      findRelayGala: async () => ({ isPublic: true }),
    });
    expect(result.status).toBe(200);
    expect(upgradeOptions).toHaveLength(1);
    expect(upgradeOptions[0]).toEqual({
      data: { galaId: "gala-1", isPublic: true },
      headers: { "Sec-WebSocket-Protocol": "deckgala.v1" },
    });
  });

  it("blocks browser requests from an unconfigured origin", async () => {
    Bun.env.CORS_ORIGIN = "https://trusted.example";
    const result = await handleRequest(new Request("http://localhost/health", {
      headers: { origin: "https://untrusted.example" },
    }));
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "Origin is not allowed" });
  });

  it("rejects oversized sync bodies before parsing or persistence", async () => {
    Bun.env.API_BEARER_TOKEN = "expected";
    const result = await handleRequest(new Request("http://localhost/api/v1/sync", {
      method: "POST",
      headers: { authorization: "Bearer expected" },
      body: "x".repeat(10 * 1024 * 1024 + 1),
    }));
    expect(result.status).toBe(413);
  });
});
