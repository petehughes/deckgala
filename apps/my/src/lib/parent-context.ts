import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export interface ParentContextResult {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  linkedSwimmers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    governingBodyId: string | null;
    squadName: string | null;
    clubName: string;
    clubId: string;
    relationship: string;
    isPrimaryContact: boolean;
    canEnterGalas: boolean;
  }>;
  activeSwimmer: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    governingBodyId: string | null;
    squadName: string | null;
    clubName: string;
    clubId: string;
    relationship: string;
    isPrimaryContact: boolean;
    canEnterGalas: boolean;
  } | null;
}

const ACTIVE_SWIMMER_COOKIE = "aquateamhub_active_swimmer";
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.aquateamhub.com";

export async function getParentContext(): Promise<ParentContextResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(`${AUTH_URL}/sign-in?callbackUrl=https://my.aquateamhub.com`);
  }

  // Fetch all swimmers linked to this parent account via ParentSwimmerLink
  const links = await prisma.parentSwimmerLink.findMany({
    where: { userId: session.user.id },
    include: {
      swimmer: {
        include: {
          club: true,
          squadRel: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Map to flat structure
  const linkedSwimmers = links.map((link) => ({
    id: link.swimmer.id,
    firstName: link.swimmer.firstName,
    lastName: link.swimmer.lastName,
    dateOfBirth: link.swimmer.dateOfBirth,
    gender: link.swimmer.gender as string | null,
    governingBodyId: link.swimmer.governingBodyId,
    squadName: link.swimmer.squadRel?.name || link.swimmer.squad || null,
    clubName: link.swimmer.club.name,
    clubId: link.swimmer.club.id,
    relationship: link.relationship,
    isPrimaryContact: link.isPrimaryContact,
    canEnterGalas: link.canEnterGalas,
  }));

  // Resolve active swimmer from cookie or default to first
  const cookieStore = await cookies();
  const activeSwimmerIdCookie = cookieStore.get(ACTIVE_SWIMMER_COOKIE)?.value;

  let activeSwimmer = linkedSwimmers.find((s) => s.id === activeSwimmerIdCookie) || null;

  if (!activeSwimmer && linkedSwimmers.length > 0) {
    activeSwimmer = linkedSwimmers[0];
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    linkedSwimmers,
    activeSwimmer,
  };
}

