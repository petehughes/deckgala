-- CreateEnum
CREATE TYPE "GuardianRelationship" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('SUBMITTED', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'WITHDRAWN');

-- AlterEnum
ALTER TYPE "ClubRole" ADD VALUE IF NOT EXISTS 'OFFICIAL';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "allowNoTime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "cutoffTimeMs" INTEGER,
ADD COLUMN IF NOT EXISTS "feePence" INTEGER,
ADD COLUMN IF NOT EXISTS "maxAge" INTEGER,
ADD COLUMN IF NOT EXISTS "minAge" INTEGER,
ADD COLUMN IF NOT EXISTS "qualifyingTimeMs" INTEGER,
ADD COLUMN IF NOT EXISTS "sessionEventNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "sessionNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Gala" ADD COLUMN IF NOT EXISTS "ageRule" TEXT NOT NULL DEFAULT 'AGE_DAY_OF_MEET',
ADD COLUMN IF NOT EXISTS "defaultEventFeePence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "entryFeePence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "venueId" TEXT;

-- AlterTable
ALTER TABLE "PlatformSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Swimmer" ADD COLUMN IF NOT EXISTS "squadId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Squad" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coachName" TEXT,
    "schedule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Venue" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT DEFAULT 'United Kingdom',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GalaEntry" (
    "id" TEXT NOT NULL,
    "galaId" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "totalFeePence" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventEntry" (
    "id" TEXT NOT NULL,
    "galaEntryId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "seedTimeMs" INTEGER,
    "feePence" INTEGER NOT NULL DEFAULT 0,
    "status" "EntryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "heat" INTEGER,
    "lane" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ParentSwimmerLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "relationship" "GuardianRelationship" NOT NULL DEFAULT 'GUARDIAN',
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT true,
    "canEnterGalas" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentSwimmerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrainingSchedule" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "squadId" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venueId" TEXT,
    "venueName" TEXT,
    "laneAllocation" TEXT,
    "coachName" TEXT,
    "drills" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Squad_clubId_idx" ON "Squad"("clubId");
CREATE UNIQUE INDEX IF NOT EXISTS "Squad_clubId_name_key" ON "Squad"("clubId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Venue_clubId_idx" ON "Venue"("clubId");
CREATE UNIQUE INDEX IF NOT EXISTS "Venue_clubId_name_key" ON "Venue"("clubId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GalaEntry_galaId_idx" ON "GalaEntry"("galaId");
CREATE INDEX IF NOT EXISTS "GalaEntry_swimmerId_idx" ON "GalaEntry"("swimmerId");
CREATE UNIQUE INDEX IF NOT EXISTS "GalaEntry_galaId_swimmerId_key" ON "GalaEntry"("galaId", "swimmerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventEntry_eventId_idx" ON "EventEntry"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventEntry_galaEntryId_eventId_key" ON "EventEntry"("galaEntryId", "eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ParentSwimmerLink_userId_idx" ON "ParentSwimmerLink"("userId");
CREATE INDEX IF NOT EXISTS "ParentSwimmerLink_swimmerId_idx" ON "ParentSwimmerLink"("swimmerId");
CREATE UNIQUE INDEX IF NOT EXISTS "ParentSwimmerLink_userId_swimmerId_key" ON "ParentSwimmerLink"("userId", "swimmerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrainingSchedule_clubId_dayOfWeek_idx" ON "TrainingSchedule"("clubId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "TrainingSchedule_squadId_idx" ON "TrainingSchedule"("squadId");
CREATE INDEX IF NOT EXISTS "TrainingSchedule_venueId_idx" ON "TrainingSchedule"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_galaId_sessionNumber_idx" ON "Event"("galaId", "sessionNumber");
CREATE INDEX IF NOT EXISTS "Gala_venueId_idx" ON "Gala"("venueId");
CREATE INDEX IF NOT EXISTS "Swimmer_squadId_idx" ON "Swimmer"("squadId");

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swimmer" ADD CONSTRAINT "Swimmer_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gala" ADD CONSTRAINT "Gala_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalaEntry" ADD CONSTRAINT "GalaEntry_galaId_fkey" FOREIGN KEY ("galaId") REFERENCES "Gala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalaEntry" ADD CONSTRAINT "GalaEntry_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_galaEntryId_fkey" FOREIGN KEY ("galaEntryId") REFERENCES "GalaEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSwimmerLink" ADD CONSTRAINT "ParentSwimmerLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSwimmerLink" ADD CONSTRAINT "ParentSwimmerLink_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
