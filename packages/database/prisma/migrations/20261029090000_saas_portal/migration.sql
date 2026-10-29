ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image" TEXT;

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubInvitation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'COACH',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE UNIQUE INDEX "ClubInvitation_tokenHash_key" ON "ClubInvitation"("tokenHash");
CREATE INDEX "ClubInvitation_clubId_expiresAt_idx" ON "ClubInvitation"("clubId", "expiresAt");
CREATE UNIQUE INDEX "BillingAccount_userId_key" ON "BillingAccount"("userId");
CREATE UNIQUE INDEX "BillingAccount_stripeCustomerId_key" ON "BillingAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingAccount_stripeSubscriptionId_key" ON "BillingAccount"("stripeSubscriptionId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubInvitation" ADD CONSTRAINT "ClubInvitation_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubInvitation" ADD CONSTRAINT "ClubInvitation_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PlatformSetting" ("key", "value") VALUES ('free_club_limit', '1');
