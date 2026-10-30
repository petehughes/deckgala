import Link from "next/link";
import { notFound } from "next/navigation";
import { createGala, createVenue, setGalaVisibility } from "../actions";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";
import { VenueMap } from "../../components/galas/venue-map";

export const dynamic = "force-dynamic";

const courseLabels: Record<string, string> = {
  SHORT_COURSE_METERS: "25m Short Course",
  LONG_COURSE_METERS: "50m Long Course",
  SHORT_COURSE_YARDS: "Short Course Yards",
};

function dateLabel(date: Date | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function GalasPage() {
  const { clubId, role } = await getActiveClub();

  const [club, clubVenues] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      include: {
        galas: {
          where: role === "PARENT" ? { isPublic: true } : {},
          orderBy: { startsAt: "desc" },
          include: {
            venueRef: true,
            events: {
              orderBy: [{ sessionNumber: "asc" }, { eventNumber: "asc" }],
            },
            entries: true,
          },
        },
      },
    }),
    prisma.venue.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  const now = new Date();
  const upcomingGalas = club.galas.filter((g) => g.startsAt >= now);
  const pastGalas = club.galas.filter((g) => g.startsAt < now);

  return (
    <div className="page-shell">
      {/* Hero Header */}
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
            <strong>{clubVenues.length}</strong>
            <span>Club Venues</span>
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
            <div className="portal-links">
              <a href="#club-venues">📍 Manage Venues ({clubVenues.length})</a>
            </div>
          </div>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Configure competition dates, select or register a pool venue with OpenStreetMap directions, and set entry fee pricing.
          </p>

          <form action={createGala} className="form-grid meet-form">
            <label>
              Meet Name *
              <input name="name" required maxLength={200} placeholder="e.g. Winter County Qualifier" />
            </label>

            <label>
              Venue Pool *
              {clubVenues.length > 0 ? (
                <select name="venueId">
                  <option value="">Select a saved club venue...</option>
                  {clubVenues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city || "UK"})
                    </option>
                  ))}
                </select>
              ) : (
                <input name="venue" required placeholder="e.g. Ponds Forge International" />
              )}
            </label>

            <label>
              Course *
              <select name="course" defaultValue="SHORT_COURSE_METERS">
                <option value="SHORT_COURSE_METERS">25m Short Course</option>
                <option value="LONG_COURSE_METERS">50m Long Course</option>
                <option value="SHORT_COURSE_YARDS">Short Course Yards</option>
              </select>
            </label>

            <label>
              Starts (UTC) *
              <input name="startsAt" type="datetime-local" required />
            </label>

            <label>
              Ends (UTC, optional)
              <input name="endsAt" type="datetime-local" />
            </label>

            <label>
              Gala Base Fee (pence)
              <input name="entryFeePence" type="number" min={0} defaultValue={500} placeholder="e.g. 500 for £5.00" />
            </label>

            <label>
              Default Event Fee (pence)
              <input name="defaultEventFeePence" type="number" min={0} defaultValue={750} placeholder="e.g. 750 for £7.50" />
            </label>

            <label>
              Age Calculation Rule
              <select name="ageRule" defaultValue="AGE_DAY_OF_MEET">
                <option value="AGE_DAY_OF_MEET">Age on the Day of Meet</option>
                <option value="AGE_DEC_31">Age as of Dec 31 (Championships)</option>
              </select>
            </label>

            <label className="checkbox-label" style={{ gridColumn: "1 / -1" }}>
              <input name="isPublic" type="checkbox" defaultChecked /> Publish live spectator results & parent entries
            </label>

            <button type="submit" style={{ gridColumn: "auto" }}>
              Create Meet
            </button>
          </form>
        </section>
      )}

      {/* Meets List */}
      <section className="panel" aria-labelledby="meets-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fixtures</p>
            <h2 id="meets-list-title">All Club Galas ({club.galas.length})</h2>
          </div>
        </div>

        <div className="meet-list">
          {club.galas.map((gala) => {
            const venueName = gala.venueRef?.name || gala.venue || "Venue TBC";
            return (
              <article className="meet-card" key={gala.id}>
                <div className="meet-header">
                  <div>
                    <h3 style={{ margin: "0 0 6px" }}>
                      <Link
                        href={`/galas/${gala.id}`}
                        style={{ color: "var(--text-primary)", textDecoration: "none" }}
                      >
                        {gala.name}
                      </Link>
                    </h3>
                    <p>
                      📍 {venueName} · {courseLabels[gala.course]} ·{" "}
                      {gala.isPublic ? "Public results" : "Private meet"} ·{" "}
                      Base Fee: <strong>{formatPence(gala.entryFeePence)}</strong> · Event:{" "}
                      <strong>{formatPence(gala.defaultEventFeePence)}</strong>
                    </p>
                  </div>
                  <div className="meet-actions">
                    <span className="mono-time">{dateLabel(gala.startsAt)}</span>
                    {canManage && (
                      <form action={setGalaVisibility} style={{ display: "inline" }}>
                        <input type="hidden" name="galaId" value={gala.id} />
                        <input type="hidden" name="isPublic" value={gala.isPublic ? "false" : "true"} />
                        <button className="button-secondary" type="submit" style={{ fontSize: "11px" }}>
                          {gala.isPublic ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <p className="muted" style={{ margin: 0, fontSize: "12px" }}>
                    {gala.events.length} {gala.events.length === 1 ? "event" : "events"} scheduled · {gala.entries.length} swimmers entered
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Link
                      href={`/galas/${gala.id}/enter`}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: "var(--accent-cyan)",
                        color: "var(--color-deep-abyss)",
                        textDecoration: "none",
                        fontWeight: 800,
                        fontSize: "11px",
                      }}
                    >
                      🏊 Enter Swimmers →
                    </Link>

                    <Link
                      href={`/galas/${gala.id}`}
                      className="button-secondary"
                      style={{ fontSize: "11px", textDecoration: "none" }}
                    >
                      📋 Details & Events
                    </Link>

                    <Link
                      href={`/galas/${gala.id}/heats`}
                      className="button-secondary"
                      style={{ fontSize: "11px", textDecoration: "none" }}
                    >
                      ⏱️ Heat Sheets
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {club.galas.length === 0 && (
            <p className="empty">
              {role === "PARENT"
                ? "No published meets available."
                : "No galas scheduled yet. Create the first meet above."}
            </p>
          )}
        </div>
      </section>

      {/* Club Venues Directory & OpenStreetMap Section */}
      <section className="panel" id="club-venues" aria-labelledby="venues-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Venue Directory</p>
            <h2 id="venues-title">Club Aquatic Venues ({clubVenues.length})</h2>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Aquatic centres and pools used for club meets with physical addresses, spectator parking guidelines, and OpenStreetMap views.
        </p>

        {clubVenues.length === 0 ? (
          <div className="empty">
            No saved venues recorded. Save your recurring aquatic centres below so they can be re-used when creating meets.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
            {clubVenues.map((venue) => (
              <VenueMap
                key={venue.id}
                name={venue.name}
                addressLine1={venue.addressLine1}
                addressLine2={venue.addressLine2}
                city={venue.city}
                postcode={venue.postcode}
                country={venue.country}
                latitude={venue.latitude}
                longitude={venue.longitude}
                notes={venue.notes}
              />
            ))}
          </div>
        )}

        {/* Add Venue Form */}
        {canManage && (
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(140, 160, 186, 0.12)" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "14px", color: "var(--text-primary)" }}>
              + Save New Pool Venue
            </h3>
            <form action={createVenue} className="form-grid">
              <label>
                Venue Name *
                <input name="name" required placeholder="e.g. Ponds Forge International" />
              </label>

              <label>
                Address Line 1
                <input name="addressLine1" placeholder="e.g. Sheaf Street" />
              </label>

              <label>
                City
                <input name="city" placeholder="e.g. Sheffield" />
              </label>

              <label>
                Postcode
                <input name="postcode" placeholder="e.g. S1 2BP" />
              </label>

              <label>
                Latitude (optional)
                <input name="latitude" type="number" step="any" placeholder="e.g. 53.3831" />
              </label>

              <label>
                Longitude (optional)
                <input name="longitude" type="number" step="any" placeholder="e.g. -1.4627" />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                Spectator & Parking Notes
                <input name="notes" placeholder="e.g. Multi-storey Q-Park adjacent with concession validation." />
              </label>

              <button type="submit">Save Venue</button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
