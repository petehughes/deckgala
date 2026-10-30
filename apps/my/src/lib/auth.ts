import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

const cookieDomain =
  process.env.COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".deckgala.com" : undefined);

export const auth = betterAuth({
  appName: "DeckGala My",
  baseURL: process.env.BETTER_AUTH_URL || "https://my.deckgala.com",
  secret: process.env.BETTER_AUTH_SECRET || "deckgala-central-auth-secret-key-32-chars-min",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      domain: cookieDomain,
    },
    defaultCookieAttributes: {
      domain: cookieDomain,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  plugins: [nextCookies()],
});

