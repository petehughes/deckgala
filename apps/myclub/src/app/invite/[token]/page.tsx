import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptClubInvitation } from "../../actions";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../../lib/session";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.AUTH_URL || "https://auth.aquateamhub.com";
const MYCLUB_URL = process.env.MYCLUB_URL || "https://myclub.aquateamhub.com";

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  if (!/^[\w-]{40,50}$/.test(token)) notFound();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.clubInvitation.findUnique({
    where: { tokenHash },
    select: { club: { select: { name: true } }, expiresAt: true, acceptedAt: true },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) notFound();
  const session = await getSession();
  const callbackUrl = `${MYCLUB_URL}/invite/${token}`;

  return (
    <section className="panel invite-panel">
      <p className="eyebrow">Club invitation</p>
      <h1>Join {invitation.club.name}</h1>
      {session ? (
        <form action={acceptClubInvitation}>
          <input type="hidden" name="token" value={token} />
          <button type="submit">Accept invitation</button>
        </form>
      ) : (
        <>
          <p className="muted">Sign in or create an account to accept this invitation.</p>
          <div className="invite-actions">
            <Link href={`${AUTH_URL}/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link>
            <Link href={`${AUTH_URL}/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create account</Link>
          </div>
        </>
      )}
    </section>
  );
}
