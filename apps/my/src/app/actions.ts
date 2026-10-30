"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import {
  pwaGalaEntrySchema,
  pushSubscriptionInputSchema,
} from "@deckgala/api-types";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Switch active swimmer cookie for family account.
 */
export async function setActiveSwimmerAction(formData: FormData): Promise<void> {
  const swimmerId = formString(formData, "swimmerId");
  const returnTo = formString(formData, "returnTo") || "/";

  if (swimmerId) {
    const cookieStore = await cookies();
    cookieStore.set("deckgala_active_swimmer", swimmerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  redirect(returnTo);
}

/**
 * Submit Gala Meet Entry from Parent/Swimmer PWA.
 */
export async function submitGalaEntryAction(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("https://auth.deckgala.com/sign-in");
  }

  const galaId = formString(formData, "galaId");
  const swimmerId = formString(formData, "swimmerId");
  const paymentMethod = formString(formData, "paymentMethod") || "POOL_DESK";
  const notes = formString(formData, "notes");

  // Collect selected events
  const selectedEventIds = formData.getAll("eventIds").map(String);
  if (selectedEventIds.length === 0) {
    redirect(`/galas/${galaId}/enter?error=Please+select+at+least+one+event`);
  }

  const eventSelections = selectedEventIds.map((eventId) => {
    const seedTimeStr = formString(formData, `seedTime_${eventId}`);
    const seedTimeMs = seedTimeStr ? parseInt(seedTimeStr, 10) : undefined;
    return {
      eventId,
      seedTimeMs: Number.isNaN(seedTimeMs) ? undefined : seedTimeMs,
      allowNoTime: true,
    };
  });

  const parsed = pwaGalaEntrySchema.parse({
    galaId,
    swimmerId,
    events: eventSelections,
    notes: notes || undefined,
    paymentMethod: paymentMethod as "ONLINE" | "POOL_DESK" | "INVOICE",
  });

  // Verify guardian permission link
  const guardianLink = await prisma.parentSwimmerLink.findFirst({
    where: {
      userId: session.user.id,
      swimmerId: parsed.swimmerId,
      canEnterGalas: true,
    },
  });

  if (!guardianLink) {
    throw new Error("You are not authorized to submit gala entries for this swimmer.");
  }

  // Fetch gala & events to calculate total fee
  const gala = await prisma.gala.findUnique({
    where: { id: parsed.galaId },
    include: {
      events: {
        where: { id: { in: parsed.events.map((e) => e.eventId) } },
      },
    },
  });

  if (!gala) throw new Error("Gala fixture not found");

  let totalFee = gala.entryFeePence;
  for (const ev of gala.events) {
    totalFee += ev.feePence ?? gala.defaultEventFeePence;
  }

  // Upsert GalaEntry and EventEntries in a transaction
  await prisma.$transaction(async (tx) => {
    const galaEntry = await tx.galaEntry.upsert({
      where: {
        galaId_swimmerId: {
          galaId: gala.id,
          swimmerId: parsed.swimmerId,
        },
      },
      update: {
        userId: session.user.id,
        totalFeePence: totalFee,
        paymentMethod: parsed.paymentMethod,
        notes: parsed.notes,
        status: "SUBMITTED",
      },
      create: {
        galaId: gala.id,
        swimmerId: parsed.swimmerId,
        userId: session.user.id,
        totalFeePence: totalFee,
        paymentMethod: parsed.paymentMethod,
        notes: parsed.notes,
        status: "SUBMITTED",
      },
    });

    for (const item of parsed.events) {
      const ev = gala.events.find((e) => e.id === item.eventId);
      const evFee = ev?.feePence ?? gala.defaultEventFeePence;

      await tx.eventEntry.upsert({
        where: {
          galaEntryId_eventId: {
            galaEntryId: galaEntry.id,
            eventId: item.eventId,
          },
        },
        update: {
          seedTimeMs: item.seedTimeMs,
          feePence: evFee,
          status: "SUBMITTED",
        },
        create: {
          galaEntryId: galaEntry.id,
          eventId: item.eventId,
          swimmerId: parsed.swimmerId,
          seedTimeMs: item.seedTimeMs,
          feePence: evFee,
          status: "SUBMITTED",
        },
      });
    }
  });

  revalidatePath(`/galas/${gala.id}/enter`);
  revalidatePath("/");
  redirect(`/galas/${gala.id}/enter?submitted=true`);
}

/**
 * Register Web Push Subscription for parent/swimmer alerts.
 */
export async function registerPushSubscription(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) return;

  const endpoint = formString(formData, "endpoint");
  const p256dh = formString(formData, "p256dh");
  const authKey = formString(formData, "auth");
  const userAgent = formString(formData, "userAgent");

  if (!endpoint || !p256dh || !authKey) return;

  const parsed = pushSubscriptionInputSchema.parse({
    endpoint,
    p256dh,
    auth: authKey,
    userAgent: userAgent || undefined,
  });

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    update: {
      userId: session.user.id,
      p256dh: parsed.p256dh,
      auth: parsed.auth,
      userAgent: parsed.userAgent,
    },
    create: {
      userId: session.user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.p256dh,
      auth: parsed.auth,
      userAgent: parsed.userAgent,
    },
  });
}

