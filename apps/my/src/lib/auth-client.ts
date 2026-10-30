import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.deckgala.com",
});

export const { signIn, signUp, signOut, useSession } = authClient;

