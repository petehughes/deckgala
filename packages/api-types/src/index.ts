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

export type SyncPayload = z.infer<typeof syncPayloadSchema>;
export type SyncSession = z.infer<typeof syncSessionSchema>;
export type SyncResult = z.infer<typeof syncResultSchema>;
export type StartGunEvent = z.infer<typeof startGunEventSchema>;
export type LaneTouchEvent = z.infer<typeof laneTouchEventSchema>;
export type DisqualificationEvent = z.infer<typeof disqualificationEventSchema>;
export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
