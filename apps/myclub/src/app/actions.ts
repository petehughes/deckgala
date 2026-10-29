"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PoolCourse, SwimStroke } from "@deckgala/database";
import {
  getFreeClubLimit,
  getStripe,
  hasRecoverableSubscription,
  isSubscriptionActive,
  syncClubSubscriptionQuantity,
} from "../lib/billing";
import { canCreateClub, parseFreeClubLimit } from "../lib/plan-policy";
import { isPlatformAdmin, requireSession } from "../lib/session";
import { getAccessibleUserClubs, requireClubRole } from "../lib/club-context";
import { prisma } from "../lib/prisma";
import { fetchSwimEnglandMemberDetails } from "../lib/swim-england-api";
import { isPromotionDue } from "../lib/squad-service";
import {
  assignSwimmerSquadSchema,
  eventFormSchema,
  formString,
  galaFormSchema,
  galaVisibilitySchema,
  invitationFormSchema,
  memberFormSchema,
  parseUtcDateTime,
  renewalFormSchema,
  squadFormSchema,
  updateMemberFormSchema,
  updateSquadFormSchema,
} from "../lib/validation";

export async function selectClub(formData: FormData): Promise<void> {
  const session = await requireSession();
  const clubId = formString(formData, "clubId");
  const access = await getAccessibleUserClubs(session.user.id);
  const membership = access.accessible.find(({ clubId: id }) => id === clubId);
  if (!membership) throw new Error("This club is unavailable to your account");
  const cookieStore = await cookies();
  cookieStore.set("deckgala_active_club", membership.clubId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/");
}

export async function createClub(formData: FormData): Promise<void> {
  const session = await requireSession();
  const name = formString(formData, "name").trim();
  if (name.length < 2 || name.length > 120) {
    throw new Error("Club name must be between 2 and 120 characters");
  }
  const result = await prisma.$transaction(async (transaction) => {
    const [adminMembershipCount, billing, setting] = await Promise.all([
      transaction.clubMembership.count({
        where: { userId: session.user.id, role: "ADMIN" },
      }),
      transaction.billingAccount.findUnique({
        where: { userId: session.user.id },
        select: { subscriptionStatus: true, stripeSubscriptionId: true },
      }),
      transaction.platformSetting.findUnique({
        where: { key: "free_club_limit" },
        select: { value: true },
      }),
    ]);
    const freeClubLimit = parseFreeClubLimit(setting?.value);
    if (!canCreateClub(adminMembershipCount, freeClubLimit, billing?.subscriptionStatus)) {
      return null;
    }
    if (billing && isSubscriptionActive(billing.subscriptionStatus) && !billing.stripeSubscriptionId) {
      throw new Error("The active Stripe subscription is missing its subscription ID");
    }
    const created = await transaction.club.create({ data: { name } });
    await transaction.clubMembership.create({
      data: { clubId: created.id, userId: session.user.id, role: "ADMIN" },
    });
    return {
      club: created,
      administratorClubCount: adminMembershipCount + 1,
      freeClubLimit,
      subscriptionStatus: billing?.subscriptionStatus ?? null,
      subscriptionId: billing?.stripeSubscriptionId ?? null,
    };
  }, { isolationLevel: "Serializable" });
  if (!result) redirect("/billing");
  const club = result.club;
  if (isSubscriptionActive(result.subscriptionStatus) && result.subscriptionId) {
    try {
      await syncClubSubscriptionQuantity(
        result.subscriptionId,
        result.administratorClubCount - result.freeClubLimit,
        `deckgala-clubs-${session.user.id}-${result.administratorClubCount}-${result.freeClubLimit}`,
      );
    } catch (error) {
      console.error("Could not update Stripe club quantity; rolling back club creation", error);
      await prisma.$transaction([
        prisma.clubMembership.deleteMany({ where: { clubId: club.id, userId: session.user.id } }),
        prisma.club.deleteMany({ where: { id: club.id } }),
      ]);
      throw new Error("The club was not created because its Stripe billing quantity could not be updated");
    }
  }
  const cookieStore = await cookies();
  cookieStore.set("deckgala_active_club", club.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/");
  redirect("/");
}

export type InvitationActionState = {
  url: string | null;
  error: string | null;
};

export async function createClubInvitation(
  _previousState: InvitationActionState,
  _formData: FormData,
): Promise<InvitationActionState> {
  void _previousState;
  const active = await requireClubRole(["ADMIN"]);
  const { role } = invitationFormSchema.parse({ role: formString(_formData, "role") });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.clubInvitation.create({
    data: {
      clubId: active.clubId,
      createdByUserId: active.session.user.id,
      tokenHash,
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("BETTER_AUTH_URL is not configured");
  return { url: new URL(`/invite/${token}`, origin).toString(), error: null };
}

export async function acceptClubInvitation(formData: FormData): Promise<void> {
  const session = await requireSession();
  const token = formString(formData, "token");
  if (!/^[\w-]{40,50}$/.test(token)) throw new Error("This invitation link is invalid");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const clubId = await prisma.$transaction(async (transaction) => {
    const invitation = await transaction.clubInvitation.findUnique({
      where: { tokenHash },
      select: { id: true, clubId: true, role: true, expiresAt: true, acceptedAt: true },
    });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
      throw new Error("This invitation link is invalid or has expired");
    }
    const membership = await transaction.clubMembership.findUnique({
      where: { clubId_userId: { clubId: invitation.clubId, userId: session.user.id } },
      select: { id: true },
    });
    if (!membership) {
      await transaction.clubMembership.create({
        data: {
          clubId: invitation.clubId,
          userId: session.user.id,
          role: invitation.role,
        },
      });
    }
    const accepted = await transaction.clubInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now },
    });
    if (accepted.count !== 1) throw new Error("This invitation has already been used");
    return invitation.clubId;
  });
  const cookieStore = await cookies();
  cookieStore.set("deckgala_active_club", clubId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/");
}

export async function updateFreeClubLimit(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user.email)) throw new Error("Platform administrator access required");
  const rawLimit = formString(formData, "limit");
  if (!/^\d{1,4}$/.test(rawLimit)) throw new Error("Enter a whole number between 0 and 1000");
  const limit = Number(rawLimit);
  if (limit < 0 || limit > 1000) throw new Error("Enter a whole number between 0 and 1000");
  await prisma.platformSetting.upsert({
    where: { key: "free_club_limit" },
    create: { key: "free_club_limit", value: String(limit) },
    update: { value: String(limit) },
  });
  revalidatePath("/platform");
  revalidatePath("/");
}

export async function claimExistingClub(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user.email)) throw new Error("Platform administrator access required");
  const clubId = formString(formData, "clubId");
  const email = formString(formData, "email").trim().toLowerCase();
  if (!email || email.length > 254) throw new Error("Enter the account email for the club administrator");
  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!targetUser) throw new Error("Create the user's account before assigning a legacy club");
  await prisma.$transaction(async (transaction) => {
    const club = await transaction.club.findFirst({
      where: { id: clubId, memberships: { none: {} } },
      select: { id: true },
    });
    if (!club) throw new Error("This club has already been claimed or does not exist");
    await transaction.clubMembership.create({
      data: { clubId: club.id, userId: targetUser.id, role: "ADMIN" },
    });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/platform");
}

export async function createStripeCheckoutSession(): Promise<void> {
  const session = await requireSession();
  const priceId = process.env.STRIPE_CLUBS_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_CLUBS_PRICE_ID is not configured");
  const stripe = getStripe();
  const [billing, adminClubCount, freeClubLimit] = await Promise.all([
    prisma.billingAccount.findUnique({ where: { userId: session.user.id } }),
    prisma.clubMembership.count({ where: { userId: session.user.id, role: "ADMIN" } }),
    getFreeClubLimit(),
  ]);
  if (adminClubCount < freeClubLimit) redirect("/");
  if (
    isSubscriptionActive(billing?.subscriptionStatus) ||
    hasRecoverableSubscription(billing?.subscriptionStatus, billing?.stripeSubscriptionId)
  ) {
    redirect("/billing");
  }
  let customerId = billing?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create(
      { email: session.user.email, name: session.user.name, metadata: { userId: session.user.id } },
      { idempotencyKey: `deckgala-customer-${session.user.id}` },
    );
    customerId = customer.id;
  }
  await prisma.billingAccount.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, stripeCustomerId: customerId },
    update: { stripeCustomerId: customerId },
  });
  const appUrl = process.env.BETTER_AUTH_URL;
  if (!appUrl) throw new Error("BETTER_AUTH_URL is not configured");
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    metadata: { userId: session.user.id },
    line_items: [{ price: priceId, quantity: Math.max(1, adminClubCount - freeClubLimit) }],
    subscription_data: { metadata: { userId: session.user.id } },
    success_url: new URL("/?billing=success", appUrl).toString(),
    cancel_url: new URL("/billing", appUrl).toString(),
  });
  if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
  redirect(checkout.url);
}

export async function openStripeBillingPortal(): Promise<void> {
  const session = await requireSession();
  const billing = await prisma.billingAccount.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!billing?.stripeCustomerId) throw new Error("No Stripe billing account is linked");
  const appUrl = process.env.BETTER_AUTH_URL;
  if (!appUrl) throw new Error("BETTER_AUTH_URL is not configured");
  const portal = await getStripe().billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: new URL("/billing", appUrl).toString(),
  });
  redirect(portal.url);
}

export async function createMember(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = memberFormSchema.parse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    governingBodyId: formString(formData, "governingBodyId"),
    emergencyContactName: formString(formData, "emergencyContactName"),
    emergencyContactPhone: formString(formData, "emergencyContactPhone"),
    dateOfBirth: formString(formData, "dateOfBirth"),
    gender: formString(formData, "gender"),
    squad: formString(formData, "squad"),
    isSwimmer: formString(formData, "isSwimmer") !== "false",
  });
  const membershipExpiresAt = new Date();
  membershipExpiresAt.setUTCFullYear(membershipExpiresAt.getUTCFullYear() + 1);
  membershipExpiresAt.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        clubId: active.clubId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        governingBodyId: data.governingBodyId,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        membershipExpiresAt,
      },
    });

    if (data.isSwimmer) {
      const dob = data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null;
      let squadId: string | null = null;
      let squadName: string | null = data.squad;
      if (data.squad) {
        const found = await tx.squad.findFirst({
          where: { clubId: active.clubId, OR: [{ id: data.squad }, { name: data.squad }] },
        });
        if (found) {
          squadId = found.id;
          squadName = found.name;
        }
      }
      await tx.swimmer.create({
        data: {
          clubId: active.clubId,
          memberId: member.id,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: dob,
          gender: data.gender,
          governingBodyId: data.governingBodyId,
          squadId,
          squad: squadName,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/roster");
  revalidatePath("/swimmers");
  revalidatePath("/squads");
}

export async function updateMember(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = updateMemberFormSchema.parse({
    memberId: formString(formData, "memberId"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    governingBodyId: formString(formData, "governingBodyId"),
    emergencyContactName: formString(formData, "emergencyContactName"),
    emergencyContactPhone: formString(formData, "emergencyContactPhone"),
    dateOfBirth: formString(formData, "dateOfBirth"),
    gender: formString(formData, "gender"),
    squad: formString(formData, "squad"),
    isSwimmer: formString(formData, "isSwimmer") !== "false",
  });

  const member = await prisma.member.findFirst({
    where: { id: data.memberId, clubId: active.clubId },
    include: { swimmer: true },
  });

  if (!member) {
    throw new Error("Member not found in this club");
  }

  await prisma.$transaction(async (tx) => {
    await tx.member.update({
      where: { id: member.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        governingBodyId: data.governingBodyId,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
      },
    });

    const dob = data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null;
    let resolvedSquadId: string | null = null;
    let resolvedSquadName: string | null = data.squad;
    if (data.squad) {
      const found = await tx.squad.findFirst({
        where: { clubId: active.clubId, OR: [{ id: data.squad }, { name: data.squad }] },
      });
      if (found) {
        resolvedSquadId = found.id;
        resolvedSquadName = found.name;
      }
    }

    if (member.swimmer) {
      await tx.swimmer.update({
        where: { id: member.swimmer.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          governingBodyId: data.governingBodyId,
          dateOfBirth: dob,
          gender: data.gender,
          squadId: resolvedSquadId,
          squad: resolvedSquadName,
        },
      });
    } else if (data.isSwimmer) {
      await tx.swimmer.create({
        data: {
          clubId: active.clubId,
          memberId: member.id,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: dob,
          gender: data.gender,
          governingBodyId: data.governingBodyId,
          squadId: resolvedSquadId,
          squad: resolvedSquadName,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/roster");
  revalidatePath("/swimmers");
  revalidatePath("/squads");
  if (member.swimmer) {
    revalidatePath(`/swimmers/${member.swimmer.id}`);
  }
}

export async function renewMembership(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = renewalFormSchema.parse({
    memberId: formString(formData, "memberId"),
    membershipExpiresAt: formString(formData, "membershipExpiresAt"),
  });
  const updated = await prisma.member.updateMany({
    where: { id: data.memberId, clubId: active.clubId },
    data: { membershipExpiresAt: new Date(`${data.membershipExpiresAt}T00:00:00.000Z`) },
  });
  if (updated.count !== 1) {
    throw new Error("Member was not found in this club");
  }
  revalidatePath("/");
}

export async function createGala(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
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
      clubId: active.clubId,
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
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = galaVisibilitySchema.parse({
    galaId: formString(formData, "galaId"),
    isPublic: formString(formData, "isPublic"),
  });
  const updated = await prisma.gala.updateMany({
    where: { id: data.galaId, clubId: active.clubId },
    data: { isPublic: data.isPublic },
  });
  if (updated.count !== 1) {
    throw new Error("Meet was not found in this club");
  }
  revalidatePath("/");
}

export async function createEvent(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = eventFormSchema.parse({
    galaId: formString(formData, "galaId"),
    eventNumber: formString(formData, "eventNumber"),
    name: formString(formData, "name"),
    distance: formString(formData, "distance"),
    stroke: formString(formData, "stroke"),
    ageGroup: formString(formData, "ageGroup"),
  });
  const gala = await prisma.gala.findFirst({
    where: { id: data.galaId, clubId: active.clubId },
    select: { id: true },
  });
  if (!gala) {
    throw new Error("Meet was not found in this club");
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

/**
 * Synchronizes swimmer date of birth and certified personal bests from Swim England API.
 */
export async function syncSwimmerWithSwimEngland(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const swimmerId = formString(formData, "swimmerId");

  const swimmer = await prisma.swimmer.findFirst({
    where: { id: swimmerId, clubId: active.clubId },
    select: { id: true, governingBodyId: true, firstName: true, lastName: true },
  });

  if (!swimmer || !swimmer.governingBodyId) {
    throw new Error("Swimmer has no Swim England number recorded");
  }

  const details = await fetchSwimEnglandMemberDetails(swimmer.governingBodyId);
  if (!details) {
    throw new Error("Could not find swimmer in Swim England registry");
  }

  await prisma.$transaction(async (tx) => {
    const dob = new Date(`${details.dateOfBirth}T00:00:00.000Z`);
    await tx.swimmer.update({
      where: { id: swimmer.id },
      data: {
        dateOfBirth: dob,
        gender: details.gender,
      },
    });

    // Ingest certified personal bests
    for (const pb of details.rankedTimes) {
      const achievedAt = new Date(`${pb.achievedAt}T00:00:00.000Z`);
      const existing = await tx.personalBest.findFirst({
        where: {
          swimmerId: swimmer.id,
          stroke: pb.stroke,
          distance: pb.distance,
          course: pb.course,
        },
      });

      if (!existing) {
        await tx.personalBest.create({
          data: {
            swimmerId: swimmer.id,
            stroke: pb.stroke,
            distance: pb.distance,
            course: pb.course,
            timeMs: pb.timeMs,
            achievedAt,
            meetName: pb.meetName,
          },
        });
      } else if (pb.timeMs < existing.timeMs) {
        await tx.personalBest.update({
          where: { id: existing.id },
          data: {
            timeMs: pb.timeMs,
            achievedAt,
            meetName: pb.meetName,
          },
        });
      }
    }
  });

  revalidatePath(`/swimmers/${swimmerId}`);
  revalidatePath("/roster");
  revalidatePath("/");
}

/**
 * Allows coaches/admins to manually record or adjust a personal best for a swimmer.
 */
export async function recordPersonalBest(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const swimmerId = formString(formData, "swimmerId");
  const stroke = formString(formData, "stroke") as SwimStroke;
  const distance = Number.parseInt(formString(formData, "distance"), 10);
  const course = formString(formData, "course") as PoolCourse;
  const timeMs = Number.parseInt(formString(formData, "timeMs"), 10);
  const meetName = formString(formData, "meetName") || "Club Time Trial";
  const achievedDateStr = formString(formData, "achievedAt");
  const achievedAt = achievedDateStr ? new Date(`${achievedDateStr}T00:00:00.000Z`) : new Date();

  if (!swimmerId || !stroke || Number.isNaN(distance) || Number.isNaN(timeMs) || timeMs <= 0) {
    throw new Error("Invalid time data provided");
  }

  const swimmer = await prisma.swimmer.findFirst({
    where: { id: swimmerId, clubId: active.clubId },
    select: { id: true },
  });
  if (!swimmer) throw new Error("Swimmer not found in this club");

  const existing = await prisma.personalBest.findFirst({
    where: { swimmerId: swimmer.id, stroke, distance, course },
  });

  if (existing) {
    await prisma.personalBest.update({
      where: { id: existing.id },
      data: { timeMs, meetName, achievedAt },
    });
  } else {
    await prisma.personalBest.create({
      data: { swimmerId: swimmer.id, stroke, distance, course, timeMs, meetName, achievedAt },
    });
  }

  revalidatePath(`/swimmers/${swimmerId}`);
}

/**
 * Schedules a future squad promotion (e.g. effective May 1st) or moves swimmer immediately.
 */
export async function scheduleSquadPromotion(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const swimmerId = formString(formData, "swimmerId");
  const targetSquad = formString(formData, "targetSquad").trim();
  const effectiveDate = formString(formData, "effectiveDate").trim();
  const notes = formString(formData, "notes").trim() || null;

  if (!swimmerId || !targetSquad || !effectiveDate) {
    throw new Error("Swimmer, target squad, and effective date are required");
  }

  const swimmer = await prisma.swimmer.findFirst({
    where: { id: swimmerId, clubId: active.clubId },
    select: { id: true, firstName: true, lastName: true, squad: true },
  });

  if (!swimmer) {
    throw new Error("Swimmer not found in this club");
  }

  const isDue = isPromotionDue(effectiveDate);

  if (isDue) {
    const matchedSquad = await prisma.squad.findFirst({
      where: {
        clubId: active.clubId,
        OR: [{ id: targetSquad }, { name: targetSquad }],
      },
    });
    await prisma.swimmer.update({
      where: { id: swimmer.id },
      data: {
        squadId: matchedSquad ? matchedSquad.id : null,
        squad: matchedSquad ? matchedSquad.name : targetSquad,
      },
    });
  }

  const club = await prisma.club.findUnique({
    where: { id: active.clubId },
    select: { customBranding: true },
  });

  const branding = (club?.customBranding as Record<string, unknown>) || {};
  const promotions = Array.isArray(branding.scheduledPromotions)
    ? [...branding.scheduledPromotions]
    : [];

  const newPromotion = {
    id: `prom-${Date.now()}`,
    swimmerId: swimmer.id,
    swimmerName: `${swimmer.firstName} ${swimmer.lastName}`,
    currentSquad: swimmer.squad || "Unassigned",
    targetSquad,
    effectiveDate,
    status: isDue ? "APPLIED" : "SCHEDULED",
    notes,
    createdAt: new Date().toISOString(),
  };

  promotions.push(newPromotion);

  await prisma.club.update({
    where: { id: active.clubId },
    data: {
      customBranding: {
        ...branding,
        scheduledPromotions: promotions,
      },
    },
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
  revalidatePath(`/swimmers/${swimmerId}`);
  revalidatePath("/roster");
}

/**
 * Cancels or removes a scheduled future promotion.
 */
export async function cancelSquadPromotion(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const promotionId = formString(formData, "promotionId");

  const club = await prisma.club.findUnique({
    where: { id: active.clubId },
    select: { customBranding: true },
  });

  const branding = (club?.customBranding as Record<string, unknown>) || {};
  if (!Array.isArray(branding.scheduledPromotions)) return;

  const updatedPromotions = branding.scheduledPromotions.filter(
    (p: any) => p.id !== promotionId,
  );

  await prisma.club.update({
    where: { id: active.clubId },
    data: {
      customBranding: {
        ...branding,
        scheduledPromotions: updatedPromotions,
      },
    },
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
}

/**
 * Creates a new first-class Squad object for the active club.
 */
export async function createSquad(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = squadFormSchema.parse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    coachName: formString(formData, "coachName"),
    schedule: formString(formData, "schedule"),
  });

  const existing = await prisma.squad.findUnique({
    where: {
      clubId_name: {
        clubId: active.clubId,
        name: data.name,
      },
    },
  });

  if (existing) {
    throw new Error(`A squad named "${data.name}" already exists in this club.`);
  }

  await prisma.squad.create({
    data: {
      clubId: active.clubId,
      name: data.name,
      description: data.description,
      coachName: data.coachName,
      schedule: data.schedule,
    },
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
}

/**
 * Updates an existing squad's details (name, coach, schedule, description).
 */
export async function updateSquad(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = updateSquadFormSchema.parse({
    squadId: formString(formData, "squadId"),
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    coachName: formString(formData, "coachName"),
    schedule: formString(formData, "schedule"),
  });

  const squad = await prisma.squad.findFirst({
    where: { id: data.squadId, clubId: active.clubId },
  });

  if (!squad) {
    throw new Error("Squad not found in this club");
  }

  await prisma.$transaction(async (tx) => {
    await tx.squad.update({
      where: { id: squad.id },
      data: {
        name: data.name,
        description: data.description,
        coachName: data.coachName,
        schedule: data.schedule,
      },
    });

    if (squad.name !== data.name) {
      await tx.swimmer.updateMany({
        where: { clubId: active.clubId, squadId: squad.id },
        data: { squad: data.name },
      });
    }
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
}

/**
 * Deletes a squad and unassigns swimmers belonging to it.
 */
export async function deleteSquad(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const squadId = formString(formData, "squadId");

  const squad = await prisma.squad.findFirst({
    where: { id: squadId, clubId: active.clubId },
  });

  if (!squad) {
    throw new Error("Squad not found in this club");
  }

  await prisma.$transaction(async (tx) => {
    await tx.swimmer.updateMany({
      where: { clubId: active.clubId, squadId: squad.id },
      data: { squadId: null, squad: null },
    });

    await tx.squad.delete({
      where: { id: squad.id },
    });
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
}

/**
 * Assigns or moves a swimmer to a specific squad.
 */
export async function assignSwimmerToSquad(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const data = assignSwimmerSquadSchema.parse({
    swimmerId: formString(formData, "swimmerId"),
    squadId: formString(formData, "squadId"),
  });

  const swimmer = await prisma.swimmer.findFirst({
    where: { id: data.swimmerId, clubId: active.clubId },
  });

  if (!swimmer) {
    throw new Error("Swimmer not found in this club");
  }

  if (data.squadId) {
    const squad = await prisma.squad.findFirst({
      where: { id: data.squadId, clubId: active.clubId },
    });

    if (!squad) {
      throw new Error("Target squad not found in this club");
    }

    await prisma.swimmer.update({
      where: { id: swimmer.id },
      data: {
        squadId: squad.id,
        squad: squad.name,
      },
    });
  } else {
    await prisma.swimmer.update({
      where: { id: swimmer.id },
      data: {
        squadId: null,
        squad: null,
      },
    });
  }

  revalidatePath("/squads");
  revalidatePath("/swimmers");
  revalidatePath(`/swimmers/${swimmer.id}`);
}

/**
 * Removes / unassigns a swimmer from their current squad.
 */
export async function removeSwimmerFromSquad(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const swimmerId = formString(formData, "swimmerId");

  const swimmer = await prisma.swimmer.findFirst({
    where: { id: swimmerId, clubId: active.clubId },
  });

  if (!swimmer) {
    throw new Error("Swimmer not found in this club");
  }

  await prisma.swimmer.update({
    where: { id: swimmer.id },
    data: {
      squadId: null,
      squad: null,
    },
  });

  revalidatePath("/squads");
  revalidatePath("/swimmers");
  revalidatePath(`/swimmers/${swimmer.id}`);
}

/**
 * Creates a swimmer directly in the club swimmer roster.
 */
export async function createSwimmer(formData: FormData): Promise<void> {
  const active = await requireClubRole(["ADMIN", "COACH"]);
  const firstName = formString(formData, "firstName").trim();
  const lastName = formString(formData, "lastName").trim();
  const dateOfBirthStr = formString(formData, "dateOfBirth").trim();
  const genderStr = formString(formData, "gender").trim();
  const governingBodyId = formString(formData, "governingBodyId").trim() || null;
  const squadId = formString(formData, "squadId").trim() || null;

  if (!firstName || !lastName) {
    throw new Error("First and last names are required");
  }

  const dob = dateOfBirthStr ? new Date(`${dateOfBirthStr}T00:00:00.000Z`) : null;
  const gender = genderStr ? (genderStr as any) : null;

  let resolvedSquadName: string | null = null;
  let resolvedSquadId: string | null = null;
  if (squadId) {
    const squad = await prisma.squad.findFirst({
      where: { clubId: active.clubId, OR: [{ id: squadId }, { name: squadId }] },
    });
    if (squad) {
      resolvedSquadId = squad.id;
      resolvedSquadName = squad.name;
    } else {
      resolvedSquadName = squadId;
    }
  }

  await prisma.swimmer.create({
    data: {
      clubId: active.clubId,
      firstName,
      lastName,
      dateOfBirth: dob,
      gender,
      governingBodyId,
      squadId: resolvedSquadId,
      squad: resolvedSquadName,
    },
  });

  revalidatePath("/swimmers");
  revalidatePath("/squads");
}
