import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.AUTH_URL || "https://auth.aquateamhub.com";
const MYCLUB_URL = process.env.MYCLUB_URL || "https://myclub.aquateamhub.com";

interface SignInPageProps {
  searchParams: Promise<{ callbackURL?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (await getSession()) redirect("/");
  const { callbackURL, callbackUrl } = await searchParams;
  const target = callbackURL || callbackUrl || MYCLUB_URL;
  redirect(`${AUTH_URL}/sign-in?callbackUrl=${encodeURIComponent(target)}`);
}
