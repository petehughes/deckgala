import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { resolveAuthRedirect } from "../lib/redirect-resolver";

export const dynamic = "force-dynamic";

export default async function AuthRootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const [memberships, guardianLinksCount] = await Promise.all([
    prisma.clubMembership.findMany({
      where: { userId: session.user.id },
      select: { role: true, clubId: true },
    }),
    prisma.parentSwimmerLink.count({
      where: { userId: session.user.id },
    }),
  ]);

  const resolved = resolveAuthRedirect({
    user: { id: session.user.id, email: session.user.email },
    memberships,
    guardianLinksCount,
  });

  redirect(resolved.targetUrl);
}

