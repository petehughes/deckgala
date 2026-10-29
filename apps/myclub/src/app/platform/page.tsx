import { notFound } from "next/navigation";
import { claimExistingClub, updateFreeClubLimit } from "../actions";
import { getFreeClubLimit } from "../../lib/billing";
import { prisma } from "../../lib/prisma";
import { isPlatformAdmin, requireSession } from "../../lib/session";

export default async function PlatformSettingsPage() {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user.email)) notFound();
  const [freeClubLimit, unassignedClubs] = await Promise.all([
    getFreeClubLimit(),
    prisma.club.findMany({
      where: { memberships: { none: {} } },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <section className="panel platform-panel">
      <a className="back-link" href="/">← Back to portal</a>
      <p className="eyebrow">Platform administration</p>
      <h1>Plan settings</h1>
      <p className="muted">Set the number of clubs each account can manage before requiring an active Stripe subscription.</p>
      <form action={updateFreeClubLimit} className="platform-form">
        <label>Free clubs per account<input name="limit" type="number" min={0} max={1000} defaultValue={freeClubLimit} required /></label>
        <button type="submit">Save allowance</button>
      </form>
      {unassignedClubs.length > 0 && (
        <section className="legacy-clubs">
          <h2>Unassigned clubs</h2>
          <p className="muted">Assign existing single-club data to its first account after migration.</p>
          {unassignedClubs.map((club) => (
            <form action={claimExistingClub} className="platform-form" key={club.id}>
              <input type="hidden" name="clubId" value={club.id} />
              <strong>{club.name}</strong>
              <label>New administrator email<input name="email" type="email" required /></label>
              <button type="submit">Assign club</button>
            </form>
          ))}
        </section>
      )}
    </section>
  );
}
