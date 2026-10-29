import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ClubRole } from "@deckgala/database";
import { getFreeClubLimit, isSubscriptionActive } from "./billing";
import { requireSession } from "./session";
import { prisma } from "./prisma";

export async function listUserClubs(userId: string) {
  return prisma.clubMembership.findMany({
    where: { userId },
    include: { club: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAccessibleUserClubs(userId: string) {
  const memberships = await listUserClubs(userId);
  const [freeClubLimit, billing] = await Promise.all([
    getFreeClubLimit(),
    prisma.billingAccount.findUnique({
      where: { userId },
      select: { subscriptionStatus: true },
    }),
  ]);
  const administratorMemberships = memberships.filter(({ role }) => role === "ADMIN");
  const subscriptionActive = isSubscriptionActive(billing?.subscriptionStatus);
  const freeClubIds = new Set(
    administratorMemberships.slice(0, freeClubLimit).map(({ clubId }) => clubId),
  );
  const accessible = memberships.filter(
    ({ clubId, role }) => role !== "ADMIN" || subscriptionActive || freeClubIds.has(clubId),
  );
  return {
    memberships,
    accessible,
    administratorClubCount: administratorMemberships.length,
    freeClubLimit,
    subscriptionActive,
    lockedClubCount: memberships.length - accessible.length,
  };
}

export async function getActiveClub() {
  const session = await requireSession();
  const { memberships, accessible } = await getAccessibleUserClubs(session.user.id);
  if (memberships.length === 0) redirect("/");

  const cookieStore = await cookies();
  const selectedId = cookieStore.get("deckgala_active_club")?.value;
  const membership = accessible.find(({ clubId }) => clubId === selectedId) ?? accessible[0];
  if (!membership) redirect("/");
  return {
    session,
    membership,
    clubId: membership.clubId,
    role: membership.role,
  };
}

export async function requireClubRole(roles: ClubRole[]) {
  const active = await getActiveClub();
  if (!roles.includes(active.role)) {
    throw new Error("You do not have permission to manage this club");
  }
  return active;
}
