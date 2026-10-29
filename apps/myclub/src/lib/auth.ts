import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

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
  appName: "DeckGala",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [nextCookies()],
});
