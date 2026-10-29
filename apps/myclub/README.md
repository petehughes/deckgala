# `@deckgala/myclub`

Next.js club administration portal for member records, membership renewal dates,
gala meets, and meet events. The portal is scoped to one club per deployment.

Configure these environment variables before starting:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `MYCLUB_CLUB_ID`: the existing club record this deployment manages.
- `MYCLUB_ACCESS_TOKEN`: access token used as the password for HTTP Basic Auth
  (username `admin`). The portal fails closed if this is missing.

Run the checked-in database migrations and generate the Prisma client from the
repository root:

```powershell
bun run --filter @deckgala/database db:migrate:deploy
bun run --filter @deckgala/database db:generate
bun run --filter @deckgala/myclub dev
```

Meet start and end values are entered and stored in UTC. New member records
receive an initial renewal date one year after creation; the member register
allows club staff to update each date. Galas are private by default. Club staff
can explicitly publish a meet's spectator results or unpublish them later.
