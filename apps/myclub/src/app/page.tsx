import { notFound } from "next/navigation";
import { createEvent, createGala, createMember, renewMembership, setGalaVisibility } from "./actions";
import { getConfiguredClubId, prisma } from "../lib/prisma";

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
  const clubId = getConfiguredClubId();
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      members: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      galas: {
        orderBy: { startsAt: "desc" },
        include: { events: { orderBy: { eventNumber: "asc" } } },
      },
    },
  });
  if (!club) notFound();

  const dueSoonCount = club.members.filter((member) => {
    const status = renewalStatus(member.membershipExpiresAt);
    return status === "Expired" || status === "Due soon" || status === "Renewal date needed";
  }).length;

  return (
    <>
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

      <section className="panel" aria-labelledby="members-title">
        <div className="section-heading">
          <div><p className="eyebrow">People</p><h2 id="members-title">Members</h2></div>
        </div>
        <form action={createMember} className="form-grid">
          <label>First name<input name="firstName" required maxLength={100} /></label>
          <label>Last name<input name="lastName" required maxLength={100} /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" type="tel" /></label>
          <label>Governing body ID<input name="governingBodyId" /></label>
          <label>Emergency contact<input name="emergencyContactName" /></label>
          <label>Emergency phone<input name="emergencyContactPhone" type="tel" /></label>
          <button type="submit">Add member</button>
        </form>

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
                    <form action={renewMembership} className="renew-form">
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="date" name="membershipExpiresAt" defaultValue={member.membershipExpiresAt?.toISOString().slice(0, 10)} required aria-label={`Renew ${member.firstName} ${member.lastName} through`} />
                      <button type="submit" className="button-secondary">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
              {club.members.length === 0 && <tr><td colSpan={4} className="empty">No members yet. Add the first member above.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="meets-title">
        <div className="section-heading"><div><p className="eyebrow">Competition</p><h2 id="meets-title">Gala meets</h2></div></div>
        <form action={createGala} className="form-grid meet-form">
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
        </form>

        <div className="meet-list">
          {club.galas.map((gala) => (
            <article className="meet-card" key={gala.id}>
              <div className="meet-header">
                <div><h3>{gala.name}</h3><p>{gala.venue ?? "Venue not set"} · {courseLabels[gala.course]} · {gala.isPublic ? "Public results" : "Private"}</p></div>
                <div className="meet-actions">
                  <span>{dateLabel(gala.startsAt)}</span>
                  <form action={setGalaVisibility}>
                    <input type="hidden" name="galaId" value={gala.id} />
                    <input type="hidden" name="isPublic" value={gala.isPublic ? "false" : "true"} />
                    <button className="button-secondary" type="submit">{gala.isPublic ? "Unpublish results" : "Publish results"}</button>
                  </form>
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
              <form action={createEvent} className="form-grid event-form">
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
              </form>
            </article>
          ))}
          {club.galas.length === 0 && <p className="empty">No meets scheduled. Create a gala above.</p>}
        </div>
      </section>
    </>
  );
}
