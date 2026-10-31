import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.AUTH_URL || "https://auth.aquateamhub.com";
const MYCLUB_URL = process.env.MYCLUB_URL || "https://myclub.aquateamhub.com";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(callbackUrl?: string) {
  const session = await getSession();
  if (!session) {
    const target = callbackUrl || MYCLUB_URL;
    redirect(`${AUTH_URL}/sign-in?callbackUrl=${encodeURIComponent(target)}`);
  }
  return session;
}

export function isPlatformAdmin(email: string): boolean {
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
