import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.AUTH_URL || "https://auth.aquateamhub.com";
const MYCLUB_URL = process.env.MYCLUB_URL || "https://myclub.aquateamhub.com";

interface SignUpPageProps {
  searchParams: Promise<{ callbackURL?: string; callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (await getSession()) redirect("/");
  const { callbackURL, callbackUrl } = await searchParams;
  const target = callbackURL || callbackUrl || MYCLUB_URL;
  redirect(`${AUTH_URL}/sign-up?callbackUrl=${encodeURIComponent(target)}`);
}
