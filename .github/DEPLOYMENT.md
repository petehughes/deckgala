# CI and release deployment

The `CI` workflow runs on pushes to `main`, pull requests, and manual dispatch.
It installs the Bun workspaces, validates Prisma, lints the maintained API and
web application sources, typechecks and tests the API and portals, builds the
three websites, and builds the Capacitor app for Android and the iOS simulator.
The unsigned Android debug APK is retained as a workflow artifact.

## Vercel

Create one Vercel project for each workspace (`apps/www`, `apps/myclub`, and
`apps/results`) and configure its monorepo root directory and production
environment variables. Add these GitHub Actions secrets to enable production
deployments after successful CI on `main`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WWW`
- `VERCEL_PROJECT_ID_MYCLUB`
- `VERCEL_PROJECT_ID_RESULTS`

Set `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` to the deployed API and results
origins as appropriate. The MyClub project also needs `DATABASE_URL`,
`MYCLUB_CLUB_ID`, and `MYCLUB_ACCESS_TOKEN`. The API deployment needs
`DATABASE_URL` and `API_BEARER_TOKEN`.

## Google Play internal track

Add the GitHub Actions repository variable `ENABLE_GOOGLE_PLAY_PUBLISH=true` to
enable signed Android App Bundle publishing on pushes to `main`. Configure
these secrets first:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `PLAY_STORE_SERVICE_ACCOUNT_JSON`

The service account must have release permissions for `com.deckgala.app`.
Successful uploads go to the Play Console `internal` track. Android version
codes use the monotonically increasing GitHub Actions run number.

## App Store Connect / TestFlight

Add the repository variable `ENABLE_APP_STORE_PUBLISH=true` to enable signed
iOS archive export and TestFlight upload on pushes to `main`. Configure:

- `IOS_DISTRIBUTION_CERTIFICATE_BASE64` (base64-encoded distribution `.p12`)
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64` (base64-encoded App Store profile for
  `com.deckgala.app`)
- `IOS_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_PRIVATE_KEY` (the `.p8` contents)

The App Store Connect API key needs app upload access. CI uploads builds to
TestFlight; App Store review and public release remain an explicit App Store
Connect action.

Keep all signing material and service-account credentials in GitHub secrets,
never in the repository.
