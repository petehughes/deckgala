# `@deckgala/results`

Public spectator portal for explicitly published galas. The meet selector,
event results, and read-only live lane updates are loaded from `@deckgala/api`;
the browser never receives the API's authenticated relay token.

Set `NEXT_PUBLIC_API_URL` to the public base URL of `@deckgala/api`, then run:

```powershell
bun run --filter @deckgala/results dev
```

Configure the API's `CORS_ORIGIN` to this site's exact origin. A club must
publish a gala from the MyClub portal for it to appear. Apply all database
migrations before enabling public results.
