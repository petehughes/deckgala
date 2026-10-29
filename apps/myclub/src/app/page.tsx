import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClub, createEvent, createGala, createMember, renewMembership, setGalaVisibility } from "./actions";
import { ClubSwitcher } from "./club-switcher";
import { InviteForm } from "./invite-form";
import { SignOutButton } from "./sign-out-button";
import { getAccessibleUserClubs } from "../lib/club-context";
import { prisma } from "../lib/prisma";
import { isPlatformAdmin, requireSession } from "../lib/session";

export const dynamic = "force-dynamic";

const courseLabels = {
  SHORT_COURSE_METERS: "25m",
  LONG_COURSE_METERS: "50m",
  SHORT_COURSE_YARDS: "Short course yards",
};

const strokeOptions = [
  ["FREESTYLE", "Freestyle"],
  ["BACKSTROKE", "Backstroke"],
  ["BREASTSTROKE", "Breaststroke"],
  ["BUTTERFLY", "Butterfly"],
  ["INDIVIDUAL_MEDLEY", "Individual medley"],
] as const;

function dateLabel(date: Date | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function renewalStatus(date: Date | null): string {
  if (!date) return "Renewal date needed";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setUTCHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= 30) return "Due soon";
  return "Active";
}

export default async function MyClubPage() {
  const session = await requireSession();
  const clubAccess = await getAccessibleUserClubs(session.user.id);
  const { memberships, accessible } = clubAccess;
  if (memberships.length === 0) {
    return (
      <section className="panel onboarding-panel">
        <p className="eyebrow">One portal. Every club.</p>
        <h1>Welcome to DeckGala.</h1>
        <p className="muted">Create a club workspace or accept an invitation from a club administrator.</p>
        <form action={createClub} className="create-club-form">
          <label>Club name<input name="name" required minLength={2} maxLength={120} /></label>
          <button type="submit">Create your club</button>
        </form>
        {isPlatformAdmin(session.user.email) && <a className="platform-link" href="/platform">Platform settings</a>}
        <SignOutButton />
      </section>
    );
  }
  if (accessible.length === 0) {
    return (
      <section className="panel onboarding-panel">
        <p className="eyebrow">Subscription required</p>
        <h1>Your club workspaces are locked.</h1>
        <p className="muted">An active subscription is needed to access clubs above the free allowance.</p>
        <a className="upgrade-link" href="/billing">Review billing</a>
        <SignOutButton />
      </section>
    );
  }
  const cookieStore = await cookies();
  const selectedId = cookieStore.get("deckgala_active_club")?.value;
  const membership = accessible.find(({ clubId }) => clubId === selectedId) ?? accessible[0];
  if (!membership) notFound();
  const clubId = membership.clubId;
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      members: {
        where: membership.role === "PARENT"
          ? { userId: session.user.id }
          : {},
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      galas: {
        where: membership.role === "PARENT" ? { isPublic: true } : {},
        orderBy: { startsAt: "desc" },
        include: { events: { orderBy: { eventNumber: "asc" } } },
      },
    },
  });
  if (!club) notFound();
  const { administratorClubCount: adminClubCount, freeClubLimit, subscriptionActive, lockedClubCount } = clubAccess;
  const canCreateClub = adminClubCount < freeClubLimit || subscriptionActive;
  const canManage = membership.role === "ADMIN" || membership.role === "COACH";

  const dueSoonCount = club.members.filter((member) => {
    const status = renewalStatus(member.membershipExpiresAt);
    return status === "Expired" || status === "Due soon" || status === "Renewal date needed";
  }).length;

  return (
    <>
      <section className="portal-toolbar">
        <ClubSwitcher clubs={accessible} selectedClubId={clubId} />
        <nav className="portal-links" aria-label="Account">
          <a href="/billing">Billing</a>
          {isPlatformAdmin(session.user.email) && <a href="/platform">Platform settings</a>}
          <span>{session.user.email}</span>
          <SignOutButton />
        </nav>
      </section>
      <section className="hero">
        <div>
          <p className="eyebrow">Club workspace</p>
          <h1>{club.name}</h1>
          <p className="muted">Manage your membership register and upcoming meets.</p>
        </div>
        <div className="summary">
          <div><strong>{club.members.length}</strong><span>Members</span></div>
          <div><strong>{dueSoonCount}</strong><span>Renewals to review</span></div>
          <div><strong>{club.galas.length}</strong><span>Meets</span></div>
        </div>
      </section>

      <section className="panel club-management">
        <div>
          <p className="eyebrow">Your account</p>
          <h2>Manage clubs</h2>
          <p className="muted">{adminClubCount} club{adminClubCount === 1 ? "" : "s"} managed · {freeClubLimit} free club{freeClubLimit === 1 ? "" : "s"} included. {subscriptionActive ? "Additional clubs are covered by your subscription." : lockedClubCount > 0 ? `${lockedClubCount} club${lockedClubCount === 1 ? " is" : "s are"} locked until billing is active.` : "Create another club by upgrading when you reach your limit."}</p>
        </div>
        {canCreateClub ? (
          <form action={createClub} className="create-club-form">
            <label>New club name<input name="name" required minLength={2} maxLength={120} /></label>
            <button type="submit">Create club</button>
          </form>
        ) : (
          <a className="upgrade-link" href="/billing">Upgrade to add clubs</a>
        )}
      </section>

      {membership.role === "ADMIN" && (
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Access</p><h2>Invite club staff</h2></div></div>
          <p className="muted">Create a one-time link that expires after seven days. Share it directly with the intended club member.</p>
          <InviteForm />
        </section>
      )}

      <section className="panel" aria-labelledby="members-title">
        <div className="section-heading">
          <div><p className="eyebrow">People</p><h2 id="members-title">{membership.role === "PARENT" ? "Your swimmer" : "Members"}</h2></div>
        </div>
        {canManage && <form action={createMember} className="form-grid">
          <label>First name<input name="firstName" required maxLength={100} /></label>
          <label>Last name<input name="lastName" required maxLength={100} /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" type="tel" /></label>
          <label>Governing body ID<input name="governingBodyId" /></label>
          <label>Emergency contact<input name="emergencyContactName" /></label>
          <label>Emergency phone<input name="emergencyContactPhone" type="tel" /></label>
          <button type="submit">Add member</button>
        </form>}

        <div className="table-scroll">
          <table>
            <thead><tr><th>Member</th><th>Contact</th><th>Membership</th><th>Renew through</th></tr></thead>
            <tbody>
              {club.members.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.firstName} {member.lastName}</strong><small>{member.governingBodyId ?? "No governing body ID"}</small></td>
                  <td>{member.email ?? member.phone ?? "No contact details"}</td>
                  <td><span className={`status status-${renewalStatus(member.membershipExpiresAt).toLowerCase().replaceAll(" ", "-")}`}>{renewalStatus(member.membershipExpiresAt)}</span></td>
                  <td>
                    {canManage ? <form action={renewMembership} className="renew-form">
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="date" name="membershipExpiresAt" defaultValue={member.membershipExpiresAt?.toISOString().slice(0, 10)} required aria-label={`Renew ${member.firstName} ${member.lastName} through`} />
                      <button type="submit" className="button-secondary">Save</button>
                    </form> : dateLabel(member.membershipExpiresAt)}
                  </td>
                </tr>
              ))}
              {club.members.length === 0 && <tr><td colSpan={4} className="empty">{membership.role === "PARENT" ? "No swimmer record is linked to this account yet." : "No members yet. Add the first member above."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="meets-title">
        <div className="section-heading"><div><p className="eyebrow">Competition</p><h2 id="meets-title">Gala meets</h2></div></div>
        {canManage && <form action={createGala} className="form-grid meet-form">
          <label>Meet name<input name="name" required maxLength={200} /></label>
          <label>Venue<input name="venue" /></label>
          <label>Course
            <select name="course" defaultValue="SHORT_COURSE_METERS">
              <option value="SHORT_COURSE_METERS">25m</option>
              <option value="LONG_COURSE_METERS">50m</option>
              <option value="SHORT_COURSE_YARDS">Short course yards</option>
            </select>
          </label>
          <label>Starts (UTC)<input name="startsAt" type="datetime-local" required /></label>
          <label>Ends (UTC, optional)<input name="endsAt" type="datetime-local" /></label>
          <label className="checkbox-label"><input name="isPublic" type="checkbox" /> Publish live results</label>
          <button type="submit">Create meet</button>
        </form>}

        <div className="meet-list">
          {club.galas.map((gala) => (
            <article className="meet-card" key={gala.id}>
              <div className="meet-header">
                <div><h3>{gala.name}</h3><p>{gala.venue ?? "Venue not set"} · {courseLabels[gala.course]} · {gala.isPublic ? "Public results" : "Private"}</p></div>
                <div className="meet-actions">
                  <span>{dateLabel(gala.startsAt)}</span>
                  {canManage && <form action={setGalaVisibility}>
                    <input type="hidden" name="galaId" value={gala.id} />
                    <input type="hidden" name="isPublic" value={gala.isPublic ? "false" : "true"} />
                    <button className="button-secondary" type="submit">{gala.isPublic ? "Unpublish results" : "Publish results"}</button>
                  </form>}
                </div>
              </div>
              <p className="muted">{gala.events.length} events</p>
              {gala.events.length > 0 && (
                <ul className="event-list">
                  {gala.events.map((event) => (
                    <li key={event.id}>
                      <span>Event {event.eventNumber}</span>
                      {event.name} · {event.distance}{gala.course === "SHORT_COURSE_YARDS" ? "yd" : "m"}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && <form action={createEvent} className="form-grid event-form">
                <input type="hidden" name="galaId" value={gala.id} />
                <label>Event no.<input name="eventNumber" type="number" min={1} required /></label>
                <label>Event name<input name="name" required maxLength={200} /></label>
                <label>Distance<input name="distance" type="number" min={1} required /></label>
                <label>Stroke
                  <select name="stroke" defaultValue="FREESTYLE">
                    {strokeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label>Age group<input name="ageGroup" placeholder="Optional" /></label>
                <button type="submit">Add event</button>
              </form>}
            </article>
          ))}
          {club.galas.length === 0 && <p className="empty">{membership.role === "PARENT" ? "No published meets are available." : "No meets scheduled. Create a gala above."}</p>}
        </div>
      </section>
    </>
  );
}
