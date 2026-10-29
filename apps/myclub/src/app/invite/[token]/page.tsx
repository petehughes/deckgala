import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptClubInvitation } from "../../actions";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../../lib/session";

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
            <Link href={`/sign-in?callbackURL=${encodeURIComponent(`/invite/${token}`)}`}>Sign in</Link>
            <Link href={`/sign-up?callbackURL=${encodeURIComponent(`/invite/${token}`)}`}>Create account</Link>
          </div>
        </>
      )}
    </section>
  );
}
