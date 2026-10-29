import { redirect } from "next/navigation";
import { safeCallbackPath } from "../../lib/redirect-url";
import { getSession } from "../../lib/session";
import { AuthForm } from "../auth-form";

interface SignUpPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (await getSession()) redirect("/");
  const { callbackURL } = await searchParams;
  return (
    <AuthForm
      mode="sign-up"
      callbackURL={safeCallbackPath(callbackURL)}
      googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
      appleEnabled={Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)}
    />
  );
}
