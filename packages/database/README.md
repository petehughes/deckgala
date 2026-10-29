# `@deckgala/database`

PostgreSQL schema and generated Prisma client for clubs, users and memberships,
swimmers and personal bests, galas and events, and offline deck-session results.

Set `DATABASE_URL` in the environment where Prisma commands run. Do not commit
database credentials. To apply the checked-in migrations to that database and
generate the client:

```powershell
bun run --filter @deckgala/database db:migrate:deploy
bun run --filter @deckgala/database db:generate
```

The checked-in migrations include the initial schema, Phase 3 membership
renewal and offline-sync result fields, and Phase 4's opt-in public-gala flag.
They have been validated with Prisma but not applied in this environment because
no PostgreSQL database or `DATABASE_URL` was available.
