import { notFound } from "next/navigation";
import { InviteForm } from "../../invite-form";
import { getActiveClub } from "../../../lib/club-context";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClubSettingsPage() {
  const { clubId, role } = await getActiveClub();

  if (role !== "ADMIN") {
    return (
      <div className="page-shell">
        <section className="panel">
          <p className="eyebrow">Access Denied</p>
          <h1>Administrator Access Required</h1>
          <p className="muted">Only club administrators can access club settings.</p>
        </section>
      </div>
    );
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
      invitations: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      },
    },
  });

  if (!club) notFound();

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Club Settings</h1>
          <p className="muted">Manage club identity, coaching staff access, and invitations.</p>
        </div>
      </section>

      {/* Club Identity */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Identity</p>
            <h2>Club Details</h2>
          </div>
        </div>
        <div className="settings-details-grid">
          <div>
            <label>Club Name</label>
            <strong>{club.name}</strong>
          </div>
          <div>
            <label>Club ID</label>
            <span className="mono-time">{club.id}</span>
          </div>
        </div>
      </section>

      {/* Staff Access & Invitations */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Access</p>
            <h2>Staff & Coaching Team</h2>
          </div>
        </div>
        <p className="muted">
          Active coaches, administrators, and timekeepers authorized for this club.
        </p>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {club.memberships.map((membership) => (
                <tr key={membership.id}>
                  <td>
                    <strong>{membership.user.name}</strong>
                    <small>{membership.user.email}</small>
                  </td>
                  <td>
                    <span className="meta-tag squad-tag">{membership.role}</span>
                  </td>
                  <td>{membership.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite Staff */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Invitations</p>
            <h2>Invite New Staff Member</h2>
          </div>
        </div>
        <p className="muted">
          Generate a 7-day single-use invitation link for a new coach, timekeeper, or parent.
        </p>
        <InviteForm />
      </section>
    </div>
  );
}

