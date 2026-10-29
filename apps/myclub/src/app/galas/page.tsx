import { notFound } from "next/navigation";
import { createEvent, createGala, setGalaVisibility } from "../actions";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";

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

export default async function GalasPage() {
  const { clubId, role, session } = await getActiveClub();

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      galas: {
        where: role === "PARENT" ? { isPublic: true } : {},
        orderBy: { startsAt: "desc" },
        include: {
          events: {
            orderBy: { eventNumber: "asc" },
          },
        },
      },
    },
  });

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  const now = new Date();
  const upcomingGalas = club.galas.filter((g) => g.startsAt >= now);
  const pastGalas = club.galas.filter((g) => g.startsAt < now);

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Competitions & Fixtures</p>
          <h1>Gala Meets</h1>
          <p className="muted">
            Schedule meets, configure event programs, manage entries, and publish live spectator streams.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{upcomingGalas.length}</strong>
            <span>Upcoming</span>
          </div>
          <div>
            <strong>{pastGalas.length}</strong>
            <span>Past Meets</span>
          </div>
          <div>
            <strong>{club.galas.reduce((acc, g) => acc + g.events.length, 0)}</strong>
            <span>Total Events</span>
          </div>
        </div>
      </section>

      {/* Meet Creation Wizard for Coaches & Admins */}
      {canManage && (
        <section className="panel" aria-labelledby="create-gala-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Meet Builder</p>
              <h2 id="create-gala-title">Schedule New Gala</h2>
            </div>
          </div>
          <form action={createGala} className="form-grid meet-form">
            <label>
              Meet name
              <input name="name" required maxLength={200} placeholder="e.g. Winter County Qualifier" />
            </label>
            <label>
              Venue
              <input name="venue" placeholder="e.g. Ponds Forge International" />
            </label>
            <label>
              Course
              <select name="course" defaultValue="SHORT_COURSE_METERS">
                <option value="SHORT_COURSE_METERS">25m Short Course</option>
                <option value="LONG_COURSE_METERS">50m Long Course</option>
                <option value="SHORT_COURSE_YARDS">Short Course Yards</option>
              </select>
            </label>
            <label>
              Starts (UTC)
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Ends (UTC, optional)
              <input name="endsAt" type="datetime-local" />
            </label>
            <label className="checkbox-label">
              <input name="isPublic" type="checkbox" /> Publish live spectator results
            </label>
            <button type="submit">Create Meet</button>
          </form>
        </section>
      )}

      {/* Meets List */}
      <section className="panel" aria-labelledby="meets-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fixtures</p>
            <h2 id="meets-list-title">All Club Galas</h2>
          </div>
        </div>

        <div className="meet-list">
          {club.galas.map((gala) => (
            <article className="meet-card" key={gala.id}>
              <div className="meet-header">
                <div>
                  <h3>{gala.name}</h3>
                  <p>
                    {gala.venue ?? "Venue not set"} · {courseLabels[gala.course]} ·{" "}
                    {gala.isPublic ? "Public results" : "Private"}
                  </p>
                </div>
                <div className="meet-actions">
                  <span>{dateLabel(gala.startsAt)}</span>
                  {canManage && (
                    <form action={setGalaVisibility}>
                      <input type="hidden" name="galaId" value={gala.id} />
                      <input type="hidden" name="isPublic" value={gala.isPublic ? "false" : "true"} />
                      <button className="button-secondary" type="submit">
                        {gala.isPublic ? "Unpublish Results" : "Publish Live Results"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <p className="muted">{gala.events.length} events scheduled</p>

              {gala.events.length > 0 && (
                <ul className="event-list">
                  {gala.events.map((event) => (
                    <li key={event.id}>
                      <span>Event {event.eventNumber}</span>
                      {event.name} · {event.distance}
                      {gala.course === "SHORT_COURSE_YARDS" ? "yd" : "m"} · {event.stroke}
                    </li>
                  ))}
                </ul>
              )}

              {canManage && (
                <form action={createEvent} className="form-grid event-form">
                  <input type="hidden" name="galaId" value={gala.id} />
                  <label>
                    Event no.
                    <input name="eventNumber" type="number" min={1} required />
                  </label>
                  <label>
                    Event name
                    <input name="name" required maxLength={200} placeholder="e.g. Girls 100m Free" />
                  </label>
                  <label>
                    Distance (m)
                    <input name="distance" type="number" min={1} required />
                  </label>
                  <label>
                    Stroke
                    <select name="stroke" defaultValue="FREESTYLE">
                      {strokeOptions.map(([val, label]) => (
                        <option value={val} key={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Age group
                    <input name="ageGroup" placeholder="e.g. 11-12" />
                  </label>
                  <button type="submit">Add Event</button>
                </form>
              )}
            </article>
          ))}

          {club.galas.length === 0 && (
            <p className="empty">
              {role === "PARENT"
                ? "No published meets available."
                : "No galas scheduled yet. Create the first meet above."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

