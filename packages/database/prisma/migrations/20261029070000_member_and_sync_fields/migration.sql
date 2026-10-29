ALTER TABLE "Member"
ADD COLUMN "membershipExpiresAt" DATE;

ALTER TABLE "RaceResult"
ADD COLUMN "sessionDate" DATE,
ADD COLUMN "sessionTime" TEXT,
ADD COLUMN "setName" TEXT,
ADD COLUMN "rep" INTEGER,
ADD COLUMN "targetTimeSec" DOUBLE PRECISION,
ADD COLUMN "finishWallMs" INTEGER;
