import { PrismaClient } from "@deckgala/database";

const globalForPrisma = globalThis as typeof globalThis & {
  deckgalaPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.deckgalaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.deckgalaPrisma = prisma;
}

export function getConfiguredClubId(): string {
  const clubId = process.env.MYCLUB_CLUB_ID?.trim();
  if (!clubId) {
    throw new Error("MYCLUB_CLUB_ID must identify the club managed by this portal");
  }
  return clubId;
}
