-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('ADMIN', 'COACH', 'TIMEKEEPER', 'PARENT');

-- CreateEnum
CREATE TYPE "PoolCourse" AS ENUM ('SHORT_COURSE_METERS', 'LONG_COURSE_METERS', 'SHORT_COURSE_YARDS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OPEN', 'OTHER');

-- CreateEnum
CREATE TYPE "SwimStroke" AS ENUM ('FREESTYLE', 'BACKSTROKE', 'BREASTSTROKE', 'BUTTERFLY', 'INDIVIDUAL_MEDLEY');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('OFFICIAL', 'UNOFFICIAL', 'DISQUALIFIED', 'DID_NOT_FINISH', 'DID_NOT_START');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "code" TEXT,
    "subscriptionTier" TEXT,
    "customBranding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMembership" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "governingBodyId" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swimmer" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "governingBodyId" TEXT,
    "squad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swimmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalBest" (
    "id" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "stroke" "SwimStroke" NOT NULL,
    "distance" INTEGER NOT NULL,
    "course" "PoolCourse" NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "achievedAt" DATE,
    "meetName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalBest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gala" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT,
    "course" "PoolCourse" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "galaId" TEXT NOT NULL,
    "eventNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "stroke" "SwimStroke" NOT NULL,
    "gender" "Gender",
    "ageGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckSession" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "deckSessionId" TEXT,
    "swimmerId" TEXT,
    "clientId" TEXT,
    "swimmerName" TEXT NOT NULL,
    "heat" INTEGER,
    "lane" INTEGER,
    "timeMs" INTEGER,
    "seedTimeMs" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'UNOFFICIAL',
    "infractionCode" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSplit" (
    "id" TEXT NOT NULL,
    "raceResultId" TEXT NOT NULL,
    "splitNumber" INTEGER NOT NULL,
    "distance" INTEGER,
    "timeMs" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3),

    CONSTRAINT "RaceSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_code_key" ON "Club"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ClubMembership_userId_idx" ON "ClubMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMembership_clubId_userId_key" ON "ClubMembership"("clubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_clubId_lastName_firstName_idx" ON "Member"("clubId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Member_clubId_governingBodyId_key" ON "Member"("clubId", "governingBodyId");

-- CreateIndex
CREATE UNIQUE INDEX "Swimmer_memberId_key" ON "Swimmer"("memberId");

-- CreateIndex
CREATE INDEX "Swimmer_clubId_lastName_firstName_idx" ON "Swimmer"("clubId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Swimmer_clubId_governingBodyId_key" ON "Swimmer"("clubId", "governingBodyId");

-- CreateIndex
CREATE INDEX "PersonalBest_swimmerId_stroke_distance_course_idx" ON "PersonalBest"("swimmerId", "stroke", "distance", "course");

-- CreateIndex
CREATE INDEX "Gala_clubId_startsAt_idx" ON "Gala"("clubId", "startsAt");

-- CreateIndex
CREATE INDEX "Event_galaId_eventNumber_idx" ON "Event"("galaId", "eventNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Event_galaId_eventNumber_key" ON "Event"("galaId", "eventNumber");

-- CreateIndex
CREATE INDEX "DeckSession_clubId_startedAt_idx" ON "DeckSession"("clubId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeckSession_clubId_clientId_key" ON "DeckSession"("clubId", "clientId");

-- CreateIndex
CREATE INDEX "RaceResult_eventId_heat_lane_idx" ON "RaceResult"("eventId", "heat", "lane");

-- CreateIndex
CREATE INDEX "RaceResult_swimmerId_recordedAt_idx" ON "RaceResult"("swimmerId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_deckSessionId_clientId_key" ON "RaceResult"("deckSessionId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceSplit_raceResultId_splitNumber_key" ON "RaceSplit"("raceResultId", "splitNumber");

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swimmer" ADD CONSTRAINT "Swimmer_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swimmer" ADD CONSTRAINT "Swimmer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalBest" ADD CONSTRAINT "PersonalBest_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gala" ADD CONSTRAINT "Gala_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_galaId_fkey" FOREIGN KEY ("galaId") REFERENCES "Gala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckSession" ADD CONSTRAINT "DeckSession_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_deckSessionId_fkey" FOREIGN KEY ("deckSessionId") REFERENCES "DeckSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "Swimmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSplit" ADD CONSTRAINT "RaceSplit_raceResultId_fkey" FOREIGN KEY ("raceResultId") REFERENCES "RaceResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
