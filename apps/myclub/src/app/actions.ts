"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
import {
  eventFormSchema,
  formString,
  galaFormSchema,
  galaVisibilitySchema,
  invitationFormSchema,
  memberFormSchema,
  parseUtcDateTime,
  renewalFormSchema,
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
  });
  const membershipExpiresAt = new Date();
  membershipExpiresAt.setUTCFullYear(membershipExpiresAt.getUTCFullYear() + 1);
  membershipExpiresAt.setUTCHours(0, 0, 0, 0);

  await prisma.member.create({
    data: {
      ...data,
      clubId: active.clubId,
      membershipExpiresAt,
    },
  });
  revalidatePath("/");
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
