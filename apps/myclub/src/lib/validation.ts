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

export const galaFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  venue: optionalText,
  course: z.enum(["SHORT_COURSE_METERS", "LONG_COURSE_METERS", "SHORT_COURSE_YARDS"]),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).or(z.literal("")),
  isPublic: z.boolean(),
});

export const eventFormSchema = z.object({
  galaId: z.string().trim().min(1).max(128),
  eventNumber: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  distance: z.coerce.number().int().positive(),
  stroke: z.enum(["FREESTYLE", "BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "INDIVIDUAL_MEDLEY"]),
  ageGroup: optionalText,
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
