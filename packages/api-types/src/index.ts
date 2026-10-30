import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(128);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const syncResultSchema = z.object({
  id: identifierSchema,
  timestamp: isoTimestampSchema,
  sessionName: z.string().trim().min(1).max(200),
  sessionDate: z.string().date(),
  sessionTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  setName: z.string().trim().min(1).max(200),
  lane: z.number().int().positive(),
  swimmer: z.string().trim().min(1).max(200),
  wave: z.number().int().positive(),
  rep: z.number().int().positive(),
  netTimeMs: z.number().int().nonnegative(),
  finishWallMs: z.number().int().nonnegative(),
  targetTimeSec: z.number().nonnegative(),
});

export const syncSessionSchema = z.object({
  id: identifierSchema,
  name: z.string().trim().min(1).max(200),
  startedAt: isoTimestampSchema,
  endedAt: isoTimestampSchema.optional(),
  results: z.array(syncResultSchema),
});

export const syncPayloadSchema = z.object({
  version: z.literal(1),
  clubId: identifierSchema,
  deviceId: identifierSchema,
  syncedAt: isoTimestampSchema,
  sessions: z.array(syncSessionSchema),
});

const eventBaseSchema = z.object({
  eventId: identifierSchema,
  galaId: identifierSchema,
  occurredAt: isoTimestampSchema,
  sourceDeviceId: identifierSchema,
});

export const startGunEventSchema = eventBaseSchema.extend({
  type: z.literal("start_gun"),
  eventNumber: z.number().int().positive(),
  heat: z.number().int().positive(),
});

export const laneTouchEventSchema = eventBaseSchema.extend({
  type: z.literal("lane_touch"),
  lane: z.number().int().positive(),
  elapsedMs: z.number().int().nonnegative(),
  swimmerId: identifierSchema.optional(),
  splitNumber: z.number().int().positive().optional(),
});

export const disqualificationEventSchema = eventBaseSchema.extend({
  type: z.literal("disqualification"),
  lane: z.number().int().positive(),
  swimmerId: identifierSchema.optional(),
  infractionCode: z.string().trim().min(1).max(32),
  notes: z.string().trim().max(500).optional(),
});

export const webSocketEventSchema = z.discriminatedUnion("type", [
  startGunEventSchema,
  laneTouchEventSchema,
  disqualificationEventSchema,
]);

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
});

export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    pagination: paginationSchema.optional(),
  });
}

// ---------------------------------------------------------------------------
// Phase 5: Centralized Auth, PWA, Training & Family Schemas
// ---------------------------------------------------------------------------

export const authRoleSchema = z.enum([
  "ADMIN",
  "COACH",
  "TIMEKEEPER",
  "OFFICIAL",
  "PARENT",
  "SWIMMER",
  "SPECTATOR",
]);

export const crossSubdomainSessionSchema = z.object({
  token: identifierSchema,
  userId: identifierSchema,
  email: z.string().email(),
  name: z.string().trim().min(1).max(200),
  activeClubId: identifierSchema.optional(),
  roles: z.array(authRoleSchema),
  isStaff: z.boolean(),
  expiresAt: isoTimestampSchema,
});

export const authRedirectTargetSchema = z.object({
  targetUrl: z.string().url(),
  portal: z.enum(["MYCLUB", "MY", "RESULTS", "WWW"]),
  reason: z.string().optional(),
});

export const guardianRelationshipSchema = z.enum([
  "MOTHER",
  "FATHER",
  "GUARDIAN",
  "OTHER",
]);

export const parentSwimmerLinkInputSchema = z.object({
  swimmerId: identifierSchema,
  relationship: guardianRelationshipSchema.default("GUARDIAN"),
  isPrimaryContact: z.boolean().default(true),
  canEnterGalas: z.boolean().default(true),
  emergencyContact: z.boolean().default(false),
});

export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const trainingScheduleInputSchema = z.object({
  clubId: identifierSchema,
  squadId: identifierSchema.optional(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  venueId: identifierSchema.optional(),
  venueName: z.string().trim().max(200).optional(),
  laneAllocation: z.string().trim().max(100).optional(),
  coachName: z.string().trim().max(100).optional(),
  drills: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const pwaEventSelectionSchema = z.object({
  eventId: identifierSchema,
  seedTimeMs: z.number().int().nonnegative().optional(),
  allowNoTime: z.boolean().default(true),
});

export const pwaGalaEntrySchema = z.object({
  galaId: identifierSchema,
  swimmerId: identifierSchema,
  events: z.array(pwaEventSelectionSchema).min(1),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["ONLINE", "POOL_DESK", "INVOICE"]).default("POOL_DESK"),
});

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
});

export type SyncPayload = z.infer<typeof syncPayloadSchema>;
export type SyncSession = z.infer<typeof syncSessionSchema>;
export type SyncResult = z.infer<typeof syncResultSchema>;
export type StartGunEvent = z.infer<typeof startGunEventSchema>;
export type LaneTouchEvent = z.infer<typeof laneTouchEventSchema>;
export type DisqualificationEvent = z.infer<typeof disqualificationEventSchema>;
export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type AuthRole = z.infer<typeof authRoleSchema>;
export type CrossSubdomainSession = z.infer<typeof crossSubdomainSessionSchema>;
export type AuthRedirectTarget = z.infer<typeof authRedirectTargetSchema>;
export type GuardianRelationship = z.infer<typeof guardianRelationshipSchema>;
export type ParentSwimmerLinkInput = z.infer<typeof parentSwimmerLinkInputSchema>;
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
export type TrainingScheduleInput = z.infer<typeof trainingScheduleInputSchema>;
export type PwaEventSelection = z.infer<typeof pwaEventSelectionSchema>;
export type PwaGalaEntry = z.infer<typeof pwaGalaEntrySchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;
