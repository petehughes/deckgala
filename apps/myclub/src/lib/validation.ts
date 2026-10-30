import { z } from "zod";

const optionalText = z.string().trim().max(200).optional().transform((value) => value || null);
const email = z.string().trim().email().or(z.literal("")).optional().transform((value) => value || null);

export const memberFormSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email,
  phone: optionalText,
  governingBodyId: optionalText,
  emergencyContactName: optionalText,
  emergencyContactPhone: optionalText,
  dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().transform((value) => value || null),
  gender: z.enum(["FEMALE", "MALE", "OPEN", "OTHER"]).or(z.literal("")).optional().transform((value) => (value ? (value as "FEMALE" | "MALE" | "OPEN" | "OTHER") : null)),
  squad: optionalText,
  isSwimmer: z.boolean().or(z.enum(["true", "false", "on"]).transform((value) => value === "true" || value === "on")).optional().default(true),
});

export const updateMemberFormSchema = memberFormSchema.extend({
  memberId: z.string().trim().min(1).max(128),
});

export const renewalFormSchema = z.object({
  memberId: z.string().trim().min(1).max(128),
  membershipExpiresAt: z.string().date(),
});

export const invitationFormSchema = z.object({
  role: z.enum(["COACH", "TIMEKEEPER", "PARENT"]),
});

export const galaVisibilitySchema = z.object({
  galaId: z.string().trim().min(1).max(128),
  isPublic: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const venueFormSchema = z.object({
  name: z.string().trim().min(1, "Venue name is required").max(120),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  postcode: optionalText,
  country: z.string().trim().optional().default("United Kingdom"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  notes: optionalText,
});

export const updateVenueFormSchema = venueFormSchema.extend({
  venueId: z.string().trim().min(1),
});

export const galaFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  venue: optionalText,
  venueId: optionalText,
  course: z.enum(["SHORT_COURSE_METERS", "LONG_COURSE_METERS", "SHORT_COURSE_YARDS"]),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).or(z.literal("")),
  entryFeePence: z.coerce.number().int().min(0).default(0),
  defaultEventFeePence: z.coerce.number().int().min(0).default(0),
  ageRule: z.enum(["AGE_DAY_OF_MEET", "AGE_DEC_31"]).default("AGE_DAY_OF_MEET"),
  isPublic: z.boolean(),
});

export const updateGalaFormSchema = galaFormSchema.extend({
  galaId: z.string().trim().min(1),
});

export const squadFormSchema = z.object({
  name: z.string().trim().min(1, "Squad name is required").max(100),
  description: optionalText,
  coachName: optionalText,
  schedule: optionalText,
});

export const updateSquadFormSchema = squadFormSchema.extend({
  squadId: z.string().trim().min(1),
});

export const assignSwimmerSquadSchema = z.object({
  swimmerId: z.string().trim().min(1),
  squadId: z.string().trim().optional().transform((value) => value || null),
});

export const eventFormSchema = z.object({
  galaId: z.string().trim().min(1).max(128),
  eventNumber: z.coerce.number().int().positive(),
  sessionNumber: z.coerce.number().int().positive().default(1),
  sessionEventNumber: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1).max(200),
  distance: z.coerce.number().int().positive(),
  stroke: z.enum(["FREESTYLE", "BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "INDIVIDUAL_MEDLEY"]),
  gender: z.enum(["FEMALE", "MALE", "OPEN", "OTHER"]).or(z.literal("")).optional().transform((v) => (v ? (v as "FEMALE" | "MALE" | "OPEN" | "OTHER") : null)),
  ageGroup: optionalText,
  minAge: z.coerce.number().int().min(5).max(100).optional().nullable(),
  maxAge: z.coerce.number().int().min(5).max(100).optional().nullable(),
  feePence: z.coerce.number().int().min(0).optional().nullable(),
  qualifyingTimeMs: z.coerce.number().int().positive().optional().nullable(),
  cutoffTimeMs: z.coerce.number().int().positive().optional().nullable(),
  allowNoTime: z.boolean().or(z.enum(["true", "false", "on"]).transform((v) => v === "true" || v === "on")).optional().default(true),
});

export const updateEventFormSchema = eventFormSchema.extend({
  eventId: z.string().trim().min(1),
});

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseUtcDateTime(value: string): Date {
  const date = new Date(`${value}:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 16) !== value) {
    throw new Error("Date and time must be valid");
  }
  return date;
}
