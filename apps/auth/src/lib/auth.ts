import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

const cookieDomain =
  process.env.COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".aquateamhub.com" : undefined);

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? {
        apple: {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: "AquaTeamHub Auth",
  baseURL: process.env.BETTER_AUTH_URL || "https://auth.aquateamhub.com",
  secret: process.env.BETTER_AUTH_SECRET || "aquateamhub-central-auth-secret-key-32-chars-min",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
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

