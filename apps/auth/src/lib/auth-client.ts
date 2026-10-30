import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || window?.location?.origin || "https://auth.aquateamhub.com",
});

export const { signIn, signUp, signOut, useSession } = authClient;

