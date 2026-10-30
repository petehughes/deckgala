import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addAllDefaultEvents, createEvent, deleteEvent, moveEventOrder, renumberGalaEvents, updateEvent, updateGala } from "../../../actions";
import { getActiveClub } from "../../../../lib/club-context";
import { prisma } from "../../../../lib/prisma";
import { formatSwimTime } from "../../../../lib/qualifying-standards";
import { getCourseDetails } from "../../../../lib/default-events";

export const dynamic = "force-dynamic";

function formatDateTimeInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function EditGalaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: galaId } = await params;
  const { clubId, role } = await getActiveClub();

  if (role !== "ADMIN" && role !== "COACH") {
    redirect(`/galas/${galaId}`);
  }

  const [gala, venues] = await Promise.all([
    prisma.gala.findFirst({
      where: { id: galaId, clubId },
      include: {
        venueRef: true,
        events: {
          orderBy: [{ sessionNumber: "asc" }, { eventNumber: "asc" }],
        },
      },
    }),
    prisma.venue.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!gala) notFound();

  const courseDetails = getCourseDetails(gala.course);
  const startsAtDefault = formatDateTimeInput(gala.startsAt);
  const endsAtDefault = formatDateTimeInput(gala.endsAt);

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <Link href={`/galas/${gala.id}`} className="back-link">
          ← Back to Gala Overview
        </Link>
      </nav>

      {/* Hero Header */}
      <section className="hero">
        <div>
          <p className="eyebrow">Fixture & Program Editor</p>
          <h1>Edit Gala: {gala.name}</h1>
          <p className="muted">
            Update competition schedule, venue, pool course, fees, age policies, and customize individual program events.
          </p>
        </div>
      </section>

      {/* Gala Details Form */}
      <section className="panel" aria-labelledby="gala-details-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fixture Configuration</p>
            <h2 id="gala-details-heading">Gala Meet Details</h2>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Modify the primary competition settings for this gala fixture.
        </p>

        <form action={updateGala} className="form-grid">
          <input type="hidden" name="galaId" value={gala.id} />

          <label>
            Gala Name *
            <input
              name="name"
              required
              defaultValue={gala.name}
              placeholder="e.g. Club Championships 2026"
            />
          </label>

          <label>
            Pool Course *
            <select name="course" defaultValue={gala.course}>
              <option value="SHORT_COURSE_METERS">25m Short Course Meters</option>
              <option value="LONG_COURSE_METERS">50m Long Course Meters</option>
              <option value="SHORT_COURSE_YARDS">Short Course Yards</option>
            </select>
          </label>

          <label>
            Venue Selection
            <select name="venueId" defaultValue={gala.venueId || ""}>
              <option value="">-- Custom Venue Name --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.city ? `(${v.city})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Custom Venue Name (if not in directory)
            <input
              name="venue"
              defaultValue={gala.venue || ""}
              placeholder="e.g. Deckgala Aquatics Centre"
            />
          </label>

          <label>
            Starts At (Date & Time) *
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={startsAtDefault}
            />
          </label>

          <label>
            Ends At (Date & Time)
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={endsAtDefault}
            />
          </label>

          <label>
            Gala Surcharge / Base Fee (pence)
            <input
              name="entryFeePence"
              type="number"
              min={0}
              defaultValue={gala.entryFeePence}
              placeholder="e.g. 0 or 500 for £5.00"
            />
          </label>

          <label>
            Default Event Fee (pence)
            <input
              name="defaultEventFeePence"
              type="number"
              min={0}
              defaultValue={gala.defaultEventFeePence}
              placeholder="e.g. 750 for £7.50"
            />
          </label>

          <label>
            Age Calculation Rule *
            <select name="ageRule" defaultValue={gala.ageRule}>
              <option value="AGE_DAY_OF_MEET">Age on Day of Meet (Open / Invitational)</option>
              <option value="AGE_DEC_31">Age as of Dec 31 (Championships / Regional)</option>
            </select>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
            <input
              id="isPublicCheck"
              name="isPublic"
              type="checkbox"
              defaultChecked={gala.isPublic}
              style={{ width: "auto" }}
            />
            <label htmlFor="isPublicCheck" style={{ margin: 0, fontWeight: 500 }}>
              Publish Gala Fixture (Visible to parents for entry submissions)
            </label>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button type="submit">Save Gala Details</button>
          </div>
        </form>
      </section>

      {/* Program Events Management */}
      <section className="panel" aria-labelledby="events-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Program Schedule</p>
            <h2 id="events-list-heading">
              Gala Events ({gala.events.length})
            </h2>
          </div>
          {gala.events.length > 0 && (
            <div>
              <form action={renumberGalaEvents} style={{ display: "inline" }}>
                <input type="hidden" name="galaId" value={gala.id} />
                <button
                  type="submit"
                  className="button-secondary"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                  title="Renumber all events sequentially 1, 2, 3..."
                >
                  🔢 Renumber 1..{gala.events.length}
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Edit distances, strokes, eligible genders, cut times, and fee overrides for individual races. Use the ▲ / ▼ buttons to adjust program order.
        </p>

        {gala.events.length === 0 ? (
          <p className="empty">No events created for this gala yet. Add events below or click &ldquo;Add All Default Events&rdquo;.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {gala.events.map((ev, evIndex) => {
              const isFirst = evIndex === 0;
              const isLast = evIndex === gala.events.length - 1;

              return (
                <div
                  key={ev.id}
                  id={`event-${ev.id}`}
                  style={{
                    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "rgba(22, 35, 59, 0.35)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <form action={moveEventOrder} style={{ display: "inline" }}>
                          <input type="hidden" name="galaId" value={gala.id} />
                          <input type="hidden" name="eventId" value={ev.id} />
                          <input type="hidden" name="direction" value="UP" />
                          <button
                            type="submit"
                            disabled={isFirst}
                            title="Move event up in order"
                            className="button-secondary"
                            style={{
                              padding: "2px 6px",
                              fontSize: "11px",
                              minWidth: "24px",
                              cursor: isFirst ? "not-allowed" : "pointer",
                              opacity: isFirst ? 0.35 : 1,
                            }}
                          >
                            ▲
                          </button>
                        </form>
                        <form action={moveEventOrder} style={{ display: "inline" }}>
                          <input type="hidden" name="galaId" value={gala.id} />
                          <input type="hidden" name="eventId" value={ev.id} />
                          <input type="hidden" name="direction" value="DOWN" />
                          <button
                            type="submit"
                            disabled={isLast}
                            title="Move event down in order"
                            className="button-secondary"
                            style={{
                              padding: "2px 6px",
                              fontSize: "11px",
                              minWidth: "24px",
                              cursor: isLast ? "not-allowed" : "pointer",
                              opacity: isLast ? 0.35 : 1,
                            }}
                          >
                            ▼
                          </button>
                        </form>
                      </div>
                      <span className="badge-pill">
                        Event #{ev.eventNumber}
                      </span>
                      <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                        {ev.name}
                      </strong>
                      <span className="muted" style={{ fontSize: "12px" }}>
                        Session {ev.sessionNumber} • {ev.distance}m • {ev.gender || "Open"} • {ev.ageGroup || "Open"}
                      </span>
                    </div>
                    <div>
                      <form action={deleteEvent} style={{ display: "inline" }}>
                        <input type="hidden" name="galaId" value={gala.id} />
                        <input type="hidden" name="eventId" value={ev.id} />
                        <button
                          type="submit"
                          className="delete-link-btn"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          Delete Event
                        </button>
                      </form>
                    </div>
                  </div>

                {/* Event Edit Form */}
                <form action={updateEvent} className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <input type="hidden" name="eventId" value={ev.id} />
                  <input type="hidden" name="galaId" value={gala.id} />

                  <label>
                    Event # *
                    <input name="eventNumber" type="number" required min={1} defaultValue={ev.eventNumber} />
                  </label>

                  <label>
                    Session # *
                    <input name="sessionNumber" type="number" required min={1} defaultValue={ev.sessionNumber} />
                  </label>

                  <label>
                    Session Event #
                    <input name="sessionEventNumber" type="number" min={1} defaultValue={ev.sessionEventNumber || ""} />
                  </label>

                  <label style={{ gridColumn: "span 2" }}>
                    Event Title *
                    <input name="name" required defaultValue={ev.name} />
                  </label>

                  <label>
                    Distance (m) *
                    <input name="distance" type="number" required min={25} defaultValue={ev.distance} />
                  </label>

                  <label>
                    Stroke *
                    <select name="stroke" defaultValue={ev.stroke}>
                      <option value="FREESTYLE">Freestyle</option>
                      <option value="BACKSTROKE">Backstroke</option>
                      <option value="BREASTSTROKE">Breaststroke</option>
                      <option value="BUTTERFLY">Butterfly</option>
                      <option value="INDIVIDUAL_MEDLEY">Individual Medley</option>
                    </select>
                  </label>

                  <label>
                    Gender *
                    <select name="gender" defaultValue={ev.gender || "OPEN"}>
                      <option value="FEMALE">Female / Girls</option>
                      <option value="MALE">Male / Boys</option>
                      <option value="OPEN">Open / Mixed</option>
                    </select>
                  </label>

                  <label>
                    Age Group
                    <input name="ageGroup" defaultValue={ev.ageGroup || "Open"} placeholder="e.g. 11-12 or Open" />
                  </label>

                  <label>
                    Fee (pence)
                    <input
                      name="feePence"
                      type="number"
                      min={0}
                      defaultValue={ev.feePence ?? ""}
                      placeholder={`Default: ${gala.defaultEventFeePence}`}
                    />
                  </label>

                  <label>
                    Qualifying Cut (ms)
                    <input
                      name="qualifyingTimeMs"
                      type="number"
                      min={0}
                      defaultValue={ev.qualifyingTimeMs ?? ""}
                      placeholder={ev.qualifyingTimeMs ? formatSwimTime(ev.qualifyingTimeMs) : "ms"}
                    />
                  </label>

                  <label>
                    Cutoff &quot;No Faster Than&quot; (ms)
                    <input
                      name="cutoffTimeMs"
                      type="number"
                      min={0}
                      defaultValue={ev.cutoffTimeMs ?? ""}
                      placeholder={ev.cutoffTimeMs ? formatSwimTime(ev.cutoffTimeMs) : "ms"}
                    />
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", gridColumn: "span 2" }}>
                    <input
                      id={`allowNoTime-${ev.id}`}
                      name="allowNoTime"
                      type="checkbox"
                      defaultChecked={ev.allowNoTime}
                      style={{ width: "auto" }}
                    />
                    <label htmlFor={`allowNoTime-${ev.id}`} style={{ margin: 0, fontSize: "12px" }}>
                      Allow No Time (NT) entries for this event
                    </label>
                  </div>

                  <div style={{ gridColumn: "span 2", marginTop: "8px" }}>
                    <button type="submit" className="secondary-btn" style={{ fontSize: "12px", padding: "6px 14px" }}>
                      Save Event #{ev.eventNumber}
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Add New Event Form */}
      <section className="panel" aria-labelledby="add-event-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Program Builder</p>
            <h2 id="add-event-heading">Add New Event to Gala</h2>
          </div>
          <form action={addAllDefaultEvents}>
            <input type="hidden" name="galaId" value={gala.id} />
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--accent-cyan)",
                color: "var(--color-deep-abyss)",
                border: "none",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ⚡ Add All Default Events ({courseDetails.eventCount} Events)
            </button>
          </form>
        </div>

        {/* Quick populate banner for pool size */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(22, 35, 59, 0.7) 100%)",
            border: "1px solid rgba(0, 229, 255, 0.25)",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="status" style={{ fontSize: "11px", padding: "2px 8px", color: "var(--accent-cyan)" }}>
                {courseDetails.badge}
              </span>
              <strong style={{ fontSize: "13px" }}>Default Program for {courseDetails.poolSizeLabel}</strong>
            </div>
            <p className="muted" style={{ fontSize: "12px", margin: 0, maxWidth: "620px" }}>
              {courseDetails.description}. Click &ldquo;Add All Default Events&rdquo; to populate the competition program with alternating Boys and Girls races. The order can then be customized at any time with the Move Up (▲) / Move Down (▼) buttons or by editing event numbers.
            </p>
          </div>
          <form action={addAllDefaultEvents}>
            <input type="hidden" name="galaId" value={gala.id} />
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "8px",
                background: "var(--accent-cyan)",
                color: "var(--color-deep-abyss)",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + Add All Default Events
            </button>
          </form>
        </div>

        <p className="muted" style={{ marginBottom: "20px" }}>
          Add another individual race to this competition schedule.
        </p>

        <form action={createEvent} className="form-grid">
          <input type="hidden" name="galaId" value={gala.id} />

          <label>
            Event Number *
            <input
              name="eventNumber"
              type="number"
              required
              min={1}
              defaultValue={gala.events.length + 1}
            />
          </label>

          <label>
            Session Number *
            <input name="sessionNumber" type="number" required min={1} defaultValue={1} />
          </label>

          <label>
            Session Event #
            <input name="sessionEventNumber" type="number" min={1} placeholder="e.g. 1" />
          </label>

          <label>
            Event Title *
            <input name="name" required placeholder="e.g. Girls 11-12 100m Freestyle" />
          </label>

          <label>
            Distance (m) *
            <input name="distance" type="number" required defaultValue={100} />
          </label>

          <label>
            Stroke *
            <select name="stroke" defaultValue="FREESTYLE">
              <option value="FREESTYLE">Freestyle</option>
              <option value="BACKSTROKE">Backstroke</option>
              <option value="BREASTSTROKE">Breaststroke</option>
              <option value="BUTTERFLY">Butterfly</option>
              <option value="INDIVIDUAL_MEDLEY">Individual Medley</option>
            </select>
          </label>

          <label>
            Gender *
            <select name="gender" defaultValue="FEMALE">
              <option value="FEMALE">Female / Girls</option>
              <option value="MALE">Male / Boys</option>
              <option value="OPEN">Open / Mixed</option>
            </select>
          </label>

          <label>
            Age Group
            <input name="ageGroup" placeholder="e.g. 11-12" defaultValue="Open" />
          </label>

          <label>
            Fee Override (pence)
            <input
              name="feePence"
              type="number"
              min={0}
              placeholder={`Default: ${gala.defaultEventFeePence} (${formatPence(gala.defaultEventFeePence)})`}
            />
          </label>

          <label>
            Qualifying Cut (ms)
            <input name="qualifyingTimeMs" type="number" placeholder="e.g. 72000 for 1:12.00" />
          </label>

          <label>
            Cutoff &quot;No Faster Than&quot; (ms)
            <input name="cutoffTimeMs" type="number" placeholder="e.g. 65000 for 1:05.00" />
          </label>

          <button type="submit">Add Event</button>
        </form>
      </section>
    </div>
  );
}

