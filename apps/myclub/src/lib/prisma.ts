import { PrismaClient } from "@aquateamhub/database";

const globalForPrisma = globalThis as typeof globalThis & {
  deckgalaPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.deckgalaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.deckgalaPrisma = prisma;
}
