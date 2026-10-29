# `@deckgala/myclub`

The DeckGala club portal is a shared SaaS workspace: one deployment and one
PostgreSQL database serve many clubs. Accounts can create clubs, switch between
their memberships, and accept time-limited invitation links. Club records are
always queried through the signed-in user's club membership.

## Configuration

For local development, create the ignored env files from the checked-in
templates:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path packages\database\.env)) { Copy-Item packages\database\.env.example packages\database\.env }
if (-not (Test-Path apps\myclub\.env.local)) { Copy-Item apps\myclub\.env.example apps\myclub\.env.local }
```

The workspace includes ignored local dotenv files for the root/API, Prisma
database package, and MyClub portal. `apps/myclub/.env.local` has a generated
development-only Better Auth secret and blank optional provider keys. `.env`
files are git-ignored; never put production credentials in these local files.
The PostgreSQL URL assumes a local `deckgala` database with the shown
development credentials. Create the database or adjust the URL before running
migrations. No OAuth or Stripe credentials are included.

- `DATABASE_URL`: PostgreSQL connection string shared with the API.
- `BETTER_AUTH_URL`: canonical portal URL (for example `http://localhost:3000`).
- `BETTER_AUTH_SECRET`: random secret of at least 32 characters.
- `PLATFORM_ADMIN_EMAILS`: comma-separated email allowlist for platform settings
  and assignment of legacy clubs after migration.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: optional Google sign-in.
- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET`: optional Apple sign-in.
- `STRIPE_SECRET_KEY`: Stripe secret API key.
- `STRIPE_CLUBS_PRICE_ID`: per-club recurring Stripe price for clubs above the
account's free allowance. Configure Stripe's customer portal for payment-method
updates and cancellation; customers should not be able to reduce their billed
quantity below the number of paid clubs.
- `STRIPE_WEBHOOK_SECRET`: signing secret for `/api/stripe/webhook`.

Email/password authentication is built in. Social sign-in buttons appear only
when the corresponding provider credentials are configured. Configure the
providers' OAuth callback URL as `${BETTER_AUTH_URL}/api/auth/callback/google`
or `${BETTER_AUTH_URL}/api/auth/callback/apple`.

The default allowance is one administrator-owned club per account. Platform
administrators can change that allowance in **Platform settings**. Stripe
subscription quantity matches the number of administrator-owned clubs above
the free allowance, and additional clubs are invoiced with proration. Configure
the recurring per-club price and billing portal in Stripe. Register a webhook for
`checkout.session.completed` and
`customer.subscription.created`, `customer.subscription.updated`, and
`customer.subscription.deleted`. If a subscription is no longer active, clubs
above the free allowance are locked until billing is restored; invited
membership in other clubs is unaffected.

Club invitations are single-use links that expire after seven days. The club
administrator shares each link directly with the intended person.

## Database setup

Apply migrations and generate Prisma Client from the repository root:

```powershell
bun run --filter @deckgala/database db:migrate:deploy
bun run --filter @deckgala/database db:generate
bun run --filter @deckgala/myclub dev
```

After migrating an existing single-club deployment, sign in with an address
listed in `PLATFORM_ADMIN_EMAILS`, create the target user's account, then use
**Platform settings → Unassigned clubs** to grant that user administrator
access to each existing club.

Meet start and end values are entered and stored in UTC. New member records
receive an initial renewal date one year after creation. Galas are private by
default; club staff can explicitly publish or unpublish spectator results.
