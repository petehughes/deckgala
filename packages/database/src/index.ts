export { Prisma, PrismaClient } from "@prisma/client";
export type {
  Club,
  ClubMembership,
  ClubRole,
  DayOfWeek,
  DeckSession,
  EntryStatus,
  Event,
  EventEntry,
  Gala,
  GalaEntry,
  Gender,
  GuardianRelationship,
  Member,
  ParentSwimmerLink,
  PersonalBest,
  PoolCourse,
  PushSubscription,
  RaceResult,
  RaceSplit,
  ResultStatus,
  SwimStroke,
  Swimmer,
  Squad,
  TrainingSchedule,
  User,
  Venue,
} from "@prisma/client";

import type { ClubRole } from "@prisma/client";

/**
 * Checks if a given ClubRole is an authorized staff role (Admin, Coach, Timekeeper, Official).
 * Parents/Swimmers are non-staff roles routed to the family PWA portal.
 */
export function isStaffRole(role: ClubRole | string | null | undefined): boolean {
  return role === "ADMIN" || role === "COACH" || role === "TIMEKEEPER" || role === "OFFICIAL";
}

