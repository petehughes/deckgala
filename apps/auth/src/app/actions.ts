"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { resolveAuthRedirect, isSafeCallbackUrl } from "../lib/redirect-resolver";
import { parentSwimmerLinkInputSchema } from "@aquateamhub/api-types";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Universal Server Action: Sign in with email and password,
 * automatically redirecting based on user role and permissions.
 */
export async function handleSignIn(formData: FormData): Promise<void> {
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const callbackUrl = formString(formData, "callbackUrl");

  if (!email || !password) {
    redirect(`/sign-in?error=Please+provide+both+email+and+password`);
  }

  try {
    const res = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    if (!res || !res.user) {
      redirect(`/sign-in?error=Invalid+credentials`);
    }

    // Lookup user memberships & linked swimmers for intelligent routing
    const [memberships, guardianLinksCount] = await Promise.all([
      prisma.clubMembership.findMany({
        where: { userId: res.user.id },
        select: { role: true, clubId: true },
      }),
      prisma.parentSwimmerLink.count({
        where: { userId: res.user.id },
      }),
    ]);

    const resolved = resolveAuthRedirect({
      user: { id: res.user.id, email: res.user.email },
      memberships,
      guardianLinksCount,
      callbackUrl: isSafeCallbackUrl(callbackUrl) ? callbackUrl : undefined,
    });

    redirect(resolved.targetUrl);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error) {
      const digest = String((error as { digest?: string }).digest);
      if (digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    const errMsg = error instanceof Error ? error.message : "Failed to sign in";
    redirect(`/sign-in?error=${encodeURIComponent(errMsg)}`);
  }
}

/**
 * Universal Server Action: Register new user account.
 */
export async function handleSignUp(formData: FormData): Promise<void> {
  const name = formString(formData, "name");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const callbackUrl = formString(formData, "callbackUrl");

  if (!name || !email || !password) {
    redirect(`/sign-up?error=All+fields+are+required`);
  }

  if (password.length < 8) {
    redirect(`/sign-up?error=Password+must+be+at+least+8+characters`);
  }

  try {
    const res = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    if (!res || !res.user) {
      redirect(`/sign-up?error=Registration+failed`);
    }

    // If an invitation token or specific club context exists, it can be attached here
    const memberships = await prisma.clubMembership.findMany({
      where: { userId: res.user.id },
      select: { role: true, clubId: true },
    });

    const resolved = resolveAuthRedirect({
      user: { id: res.user.id, email: res.user.email },
      memberships,
      guardianLinksCount: 0,
      callbackUrl: isSafeCallbackUrl(callbackUrl) ? callbackUrl : undefined,
    });

    redirect(resolved.targetUrl);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error) {
      const digest = String((error as { digest?: string }).digest);
      if (digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    const errMsg = error instanceof Error ? error.message : "Failed to create account";
    redirect(`/sign-up?error=${encodeURIComponent(errMsg)}`);
  }
}

/**
 * Server Action: Parent-Swimmer Profile Linking.
 */
export async function linkSwimmerProfile(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in?error=Please+sign+in+to+link+a+swimmer");
  }

  const swimmerId = formString(formData, "swimmerId");
  const governingBodyId = formString(formData, "governingBodyId");
  const relationship = formString(formData, "relationship") || "GUARDIAN";

  let targetSwimmerId = swimmerId;

  if (!targetSwimmerId && governingBodyId) {
    const found = await prisma.swimmer.findFirst({
      where: { governingBodyId },
    });
    if (!found) {
      redirect("/link-swimmer?error=No+swimmer+found+with+that+Swim+England+ID");
    }
    targetSwimmerId = found.id;
  }

  if (!targetSwimmerId) {
    redirect("/link-swimmer?error=Swimmer+selection+required");
  }

  const parsed = parentSwimmerLinkInputSchema.parse({
    swimmerId: targetSwimmerId,
    relationship: relationship as "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER",
    isPrimaryContact: formString(formData, "isPrimaryContact") !== "false",
    canEnterGalas: formString(formData, "canEnterGalas") !== "false",
    emergencyContact: formString(formData, "emergencyContact") === "true",
  });

  await prisma.parentSwimmerLink.upsert({
    where: {
      userId_swimmerId: {
        userId: session.user.id,
        swimmerId: parsed.swimmerId,
      },
    },
    update: {
      relationship: parsed.relationship,
      isPrimaryContact: parsed.isPrimaryContact,
      canEnterGalas: parsed.canEnterGalas,
      emergencyContact: parsed.emergencyContact,
    },
    create: {
      userId: session.user.id,
      swimmerId: parsed.swimmerId,
      relationship: parsed.relationship,
      isPrimaryContact: parsed.isPrimaryContact,
      canEnterGalas: parsed.canEnterGalas,
      emergencyContact: parsed.emergencyContact,
    },
  });

  // Ensure user has PARENT club membership if swimmer is enrolled in a club
  const swimmer = await prisma.swimmer.findUnique({
    where: { id: parsed.swimmerId },
    select: { clubId: true },
  });

  if (swimmer?.clubId) {
    await prisma.clubMembership.upsert({
      where: {
        clubId_userId: {
          clubId: swimmer.clubId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        clubId: swimmer.clubId,
        userId: session.user.id,
        role: "PARENT",
      },
    });
  }

  const myUrl = process.env.MY_URL || "https://my.aquateamhub.com";
  redirect(`${myUrl}/my-swimmers?linked=true`);
}

/**
 * Server Action: Sign out of all AquaTeamHub subdomains.
 */
export async function handleSignOut(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/sign-in");
}

