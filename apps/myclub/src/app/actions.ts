"use server";

import { revalidatePath } from "next/cache";
import { getConfiguredClubId, prisma } from "../lib/prisma";
import {
  eventFormSchema,
  formString,
  galaFormSchema,
  galaVisibilitySchema,
  memberFormSchema,
  parseUtcDateTime,
  renewalFormSchema,
} from "../lib/validation";

export async function createMember(formData: FormData): Promise<void> {
  const data = memberFormSchema.parse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    governingBodyId: formString(formData, "governingBodyId"),
    emergencyContactName: formString(formData, "emergencyContactName"),
    emergencyContactPhone: formString(formData, "emergencyContactPhone"),
  });
  const membershipExpiresAt = new Date();
  membershipExpiresAt.setUTCFullYear(membershipExpiresAt.getUTCFullYear() + 1);
  membershipExpiresAt.setUTCHours(0, 0, 0, 0);

  await prisma.member.create({
    data: {
      ...data,
      clubId: getConfiguredClubId(),
      membershipExpiresAt,
    },
  });
  revalidatePath("/");
}

export async function renewMembership(formData: FormData): Promise<void> {
  const data = renewalFormSchema.parse({
    memberId: formString(formData, "memberId"),
    membershipExpiresAt: formString(formData, "membershipExpiresAt"),
  });
  const updated = await prisma.member.updateMany({
    where: { id: data.memberId, clubId: getConfiguredClubId() },
    data: { membershipExpiresAt: new Date(`${data.membershipExpiresAt}T00:00:00.000Z`) },
  });
  if (updated.count !== 1) {
    throw new Error("Member was not found in the configured club");
  }
  revalidatePath("/");
}

export async function createGala(formData: FormData): Promise<void> {
  const data = galaFormSchema.parse({
    name: formString(formData, "name"),
    venue: formString(formData, "venue"),
    course: formString(formData, "course"),
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
    isPublic: formString(formData, "isPublic") === "on",
  });
  const startsAt = parseUtcDateTime(data.startsAt);
  const endsAt = data.endsAt ? parseUtcDateTime(data.endsAt) : null;
  if (endsAt && endsAt <= startsAt) {
    throw new Error("Meet end time must be later than its start time");
  }

  await prisma.gala.create({
    data: {
      clubId: getConfiguredClubId(),
      name: data.name,
      venue: data.venue,
      course: data.course,
      startsAt,
      endsAt,
      isPublic: data.isPublic,
    },
  });
  revalidatePath("/");
}

export async function setGalaVisibility(formData: FormData): Promise<void> {
  const data = galaVisibilitySchema.parse({
    galaId: formString(formData, "galaId"),
    isPublic: formString(formData, "isPublic"),
  });
  const updated = await prisma.gala.updateMany({
    where: { id: data.galaId, clubId: getConfiguredClubId() },
    data: { isPublic: data.isPublic },
  });
  if (updated.count !== 1) {
    throw new Error("Meet was not found in the configured club");
  }
  revalidatePath("/");
}

export async function createEvent(formData: FormData): Promise<void> {
  const data = eventFormSchema.parse({
    galaId: formString(formData, "galaId"),
    eventNumber: formString(formData, "eventNumber"),
    name: formString(formData, "name"),
    distance: formString(formData, "distance"),
    stroke: formString(formData, "stroke"),
    ageGroup: formString(formData, "ageGroup"),
  });
  const gala = await prisma.gala.findFirst({
    where: { id: data.galaId, clubId: getConfiguredClubId() },
    select: { id: true },
  });
  if (!gala) {
    throw new Error("Meet was not found in the configured club");
  }
  await prisma.event.create({
    data: {
      galaId: gala.id,
      eventNumber: data.eventNumber,
      name: data.name,
      distance: data.distance,
      stroke: data.stroke,
      ageGroup: data.ageGroup,
    },
  });
  revalidatePath("/");
}
