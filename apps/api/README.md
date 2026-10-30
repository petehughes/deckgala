# `@aquateamhub/api`

Bun HTTP and WebSocket service for offline deck-session sync and gala event
relays. It uses the shared runtime schemas in `@aquateamhub/api-types` and persists
sync uploads with `@aquateamhub/database`.

Configure `DATABASE_URL` and `API_BEARER_TOKEN`, then run database migrations
and generate the Prisma client:

```powershell
bun run --filter @aquateamhub/database db:migrate:deploy
bun run --filter @aquateamhub/database db:generate
bun run --filter @aquateamhub/api dev
```

The service listens on port `3001` by default; override it with `PORT`.
Set `CORS_ORIGIN` to the exact web-app origin when browser clients call the
sync endpoint. It defaults to `*` for native clients and local development.

- `GET /health` returns the liveness status.
- `GET /api/v1/public/galas` lists only galas explicitly published by a club.
- `GET /api/v1/public/galas/:galaId` returns a published gala, its events,
  recorded event results, and splits. Non-public and unknown galas both return
  `404`.
- `GET /api/v1/public/galas/:galaId/stream` opens a read-only Server-Sent Events
  stream for published galas. The stream replays the active heat snapshot and
  then delivers validated start, touch, and disqualification events.
- `POST /api/v1/sync` accepts a validated version-1 `SyncPayload` and upserts
  deck sessions and race results. Supply `Authorization: Bearer <token>`.
- `GET /api/v1/relay?galaId=<id>` upgrades to a WebSocket room. The same bearer
  token is required in the upgrade request; validated events are relayed to
  other connected clients in that gala room. Browser clients, which cannot set
  an `Authorization` header on `WebSocket`, should offer the subprotocols
  `deckgala.v1` and `deckgala.bearer.<token>`.

Uploads are limited to 10 MB. Unknown clubs are rejected, and an unavailable
database is reported as a server error rather than a successful sync response.
Public result access is opt-in per gala; apply the public-gala database
migration before publishing meets.
