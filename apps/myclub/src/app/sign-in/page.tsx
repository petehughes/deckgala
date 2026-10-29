import { redirect } from "next/navigation";
import { safeCallbackPath } from "../../lib/redirect-url";
import { getSession } from "../../lib/session";
import { AuthForm } from "../auth-form";

interface SignInPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (await getSession()) redirect("/");
  const { callbackURL } = await searchParams;
  return (
    <AuthForm
      mode="sign-in"
      callbackURL={safeCallbackPath(callbackURL)}
      googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
      appleEnabled={Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)}
    />
  );
}
