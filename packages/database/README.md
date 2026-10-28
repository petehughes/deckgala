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

The initial migration is in `prisma/migrations/`. It was generated and validated
as part of Phase 2, but has not been applied: no PostgreSQL database or
`DATABASE_URL` was available in the setup environment.
