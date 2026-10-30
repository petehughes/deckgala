import Link from "next/link";
import { notFound } from "next/navigation";
import { addAllDefaultEvents, createEvent, moveEventOrder, renumberGalaEvents, setGalaVisibility } from "../../actions";
import { getActiveClub } from "../../../lib/club-context";
import { prisma } from "../../../lib/prisma";
import { formatSwimTime } from "../../../lib/qualifying-standards";
import { getCourseDetails } from "../../../lib/default-events";
import { VenueMap } from "../../../components/galas/venue-map";
import { SportsysEntryUploader } from "../../../components/galas/sportsys-entry-uploader";

export const dynamic = "force-dynamic";

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

const strokeLabels: Record<string, string> = {
  FREESTYLE: "Freestyle",
  BACKSTROKE: "Backstroke",
  BREASTSTROKE: "Breaststroke",
  BUTTERFLY: "Butterfly",
  INDIVIDUAL_MEDLEY: "Individual Medley",
};

export default async function GalaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: galaId } = await params;
  const { clubId, role } = await getActiveClub();

  const gala = await prisma.gala.findFirst({
    where: {
      id: galaId,
      clubId,
      ...(role === "PARENT" ? { isPublic: true } : {}),
    },
    include: {
      venueRef: true,
      events: {
        include: {
          entries: {
            include: {
              galaEntry: {
                include: {
                  swimmer: true,
                },
              },
            },
          },
        },
        orderBy: [{ sessionNumber: "asc" }, { eventNumber: "asc" }],
      },
      entries: {
        include: {
          swimmer: true,
          eventEntries: true,
        },
      },
    },
  });

  if (!gala) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  // Group events by session
  const sessionMap = new Map<number, typeof gala.events>();
  for (const event of gala.events) {
    const sNum = event.sessionNumber || 1;
    const list = sessionMap.get(sNum) ?? [];
    list.push(event);
    sessionMap.set(sNum, list);
  }
  const sessionNumbers = Array.from(sessionMap.keys()).sort((a, b) => a - b);

  const courseDetails = getCourseDetails(gala.course);
  const courseBadge = courseDetails.badge;

  const totalSwimmerEntries = gala.entries.length;
  const totalRaceStarts = gala.events.reduce((acc, ev) => acc + ev.entries.length, 0);

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <Link href="/galas" className="back-link">
          ← Back to Gala Fixtures
        </Link>
      </nav>

      {/* Hero Header */}
      <section className="hero">
        <div>
          <p className="eyebrow">{courseBadge}</p>
          <h1>{gala.name}</h1>
          <p className="muted">
            Competition schedule, event program, qualifying cut times, and entry management.
          </p>
        </div>

        <div className="summary">
          <div>
            <strong>{formatPence(gala.entryFeePence)}</strong>
            <span>Gala Base Fee</span>
          </div>
          <div>
            <strong>{formatPence(gala.defaultEventFeePence)}</strong>
            <span>Event Entry Fee</span>
          </div>
          <div>
            <strong>{totalSwimmerEntries}</strong>
            <span>Swimmers Entered</span>
          </div>
          <div>
            <strong>{totalRaceStarts}</strong>
            <span>Race Starts</span>
          </div>
        </div>
      </section>

      {/* Action Toolbar */}
      <section className="panel" style={{ padding: "16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href={`/galas/${gala.id}/enter`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--accent-cyan)",
                color: "var(--color-deep-abyss)",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "12px",
              }}
            >
              🏊 Enter Swimmers (Family Wizard) →
            </Link>

            <Link
              href={`/galas/${gala.id}/heats`}
              className="button-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
            >
              📋 Poolside Heat Sheets
            </Link>

            {canManage && (
              <Link
                href={`/galas/${gala.id}/edit`}
                className="button-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              >
                ⚙ Edit Gala & Events
              </Link>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "12px" }}>
              Age Computation: <strong>{gala.ageRule === "AGE_DEC_31" ? "Age as of Dec 31" : "Age on Day of Meet"}</strong>
            </span>
            {canManage && (
              <form action={setGalaVisibility} style={{ display: "inline" }}>
                <input type="hidden" name="galaId" value={gala.id} />
                <input type="hidden" name="isPublic" value={gala.isPublic ? "false" : "true"} />
                <button type="submit" className="button-secondary" style={{ fontSize: "11px" }}>
                  {gala.isPublic ? "Set Meet Private" : "Publish Publicly"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Venue & OpenStreetMap Card */}
      <section className="panel" aria-labelledby="venue-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Location & Directions</p>
            <h2 id="venue-title">Competition Pool & Venue</h2>
          </div>
        </div>

        <VenueMap
          name={gala.venueRef?.name || gala.venue || "Competition Pool"}
          addressLine1={gala.venueRef?.addressLine1}
          addressLine2={gala.venueRef?.addressLine2}
          city={gala.venueRef?.city}
          postcode={gala.venueRef?.postcode}
          country={gala.venueRef?.country}
          latitude={gala.venueRef?.latitude}
          longitude={gala.venueRef?.longitude}
          notes={gala.venueRef?.notes}
        />
      </section>

      {/* Program of Events grouped by Session */}
      <section className="panel" aria-labelledby="program-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Competition Schedule</p>
            <h2 id="program-title">Event Program ({gala.events.length} Events)</h2>
          </div>
          <div className="portal-links" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {canManage && gala.events.length > 0 && (
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
            )}
            <Link href={`/galas/${gala.id}/enter`}>Submit Entry Request</Link>
          </div>
        </div>

        {sessionNumbers.length === 0 ? (
          <div className="empty">
            No events have been added to this gala yet. Use the Program Builder below to add all default events or create custom races.
          </div>
        ) : (
          sessionNumbers.map((sNum) => {
            const events = sessionMap.get(sNum) ?? [];
            return (
              <div key={sNum} style={{ marginBottom: "28px" }}>
                <div className="heat-sheet-banner">
                  <strong>SESSION {sNum} PROGRAM</strong>
                  <span className="muted" style={{ fontSize: "12px" }}>
                    {events.length} {events.length === 1 ? "Event" : "Events"} in Session
                  </span>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Ev #</th>
                        <th>Session Ev</th>
                        <th>Gender</th>
                        <th>Event Description</th>
                        <th>Age Group</th>
                        <th>Qualifying Cut</th>
                        <th>Cutoff (No Faster Than)</th>
                        <th>Entry Fee</th>
                        <th>Entries</th>
                        {canManage && <th>Order / Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => {
                        const eventFee = ev.feePence ?? gala.defaultEventFeePence;
                        const evIndexInAll = gala.events.findIndex((e) => e.id === ev.id);
                        const isFirstInAll = evIndexInAll === 0;
                        const isLastInAll = evIndexInAll === gala.events.length - 1;

                        return (
                          <tr key={ev.id}>
                            <td>
                              <strong>#{ev.eventNumber}</strong>
                            </td>
                            <td>
                              {ev.sessionEventNumber ? `Session ${sNum}, Ev ${ev.sessionEventNumber}` : "—"}
                            </td>
                            <td>
                              <span className="status" style={{ fontSize: "11px", padding: "2px 8px" }}>
                                {ev.gender === "MALE" ? "Boys / Men" : ev.gender === "FEMALE" ? "Girls / Women" : "Open / Mixed"}
                              </span>
                            </td>
                            <td>
                              <strong>
                                {ev.distance}m {strokeLabels[ev.stroke] || ev.stroke}
                              </strong>
                              <small>{ev.name}</small>
                            </td>
                            <td>{ev.ageGroup || "Open"}</td>
                            <td>
                              {ev.qualifyingTimeMs ? (
                                <span className="mono-time">{formatSwimTime(ev.qualifyingTimeMs)}</span>
                              ) : (
                                <span className="muted" style={{ fontSize: "11px" }}>None (Open)</span>
                              )}
                            </td>
                            <td>
                              {ev.cutoffTimeMs ? (
                                <span className="mono-time" style={{ color: "var(--color-caution-amber)" }}>
                                  {formatSwimTime(ev.cutoffTimeMs)}
                                </span>
                              ) : (
                                <span className="muted" style={{ fontSize: "11px" }}>None</span>
                              )}
                            </td>
                            <td>
                              <span className="mono-time">{formatPence(eventFee)}</span>
                            </td>
                            <td>
                              <span className="status">
                                {ev.entries.length} {ev.entries.length === 1 ? "Entry" : "Entries"}
                              </span>
                            </td>
                            {canManage && (
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <form action={moveEventOrder} style={{ display: "inline" }}>
                                    <input type="hidden" name="galaId" value={gala.id} />
                                    <input type="hidden" name="eventId" value={ev.id} />
                                    <input type="hidden" name="direction" value="UP" />
                                    <button
                                      type="submit"
                                      disabled={isFirstInAll}
                                      title="Move event up in program order"
                                      className="button-secondary"
                                      style={{
                                        padding: "2px 6px",
                                        fontSize: "11px",
                                        minWidth: "24px",
                                        cursor: isFirstInAll ? "not-allowed" : "pointer",
                                        opacity: isFirstInAll ? 0.35 : 1,
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
                                      disabled={isLastInAll}
                                      title="Move event down in program order"
                                      className="button-secondary"
                                      style={{
                                        padding: "2px 6px",
                                        fontSize: "11px",
                                        minWidth: "24px",
                                        cursor: isLastInAll ? "not-allowed" : "pointer",
                                        opacity: isLastInAll ? 0.35 : 1,
                                      }}
                                    >
                                      ▼
                                    </button>
                                  </form>
                                  <Link
                                    href={`/galas/${gala.id}/edit#event-${ev.id}`}
                                    title="Edit event details"
                                    className="button-secondary"
                                    style={{ padding: "2px 6px", fontSize: "11px", textDecoration: "none" }}
                                  >
                                    Edit
                                  </Link>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add Event Form for Coaches & Admins */}
      {canManage && (
        <section className="panel" aria-labelledby="add-event-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Program Builder</p>
              <h2 id="add-event-title">Add Event to Gala</h2>
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
                {courseDetails.description}. Click &ldquo;Add All Default Events&rdquo; to populate the competition program with alternating Boys and Girls races. The order can then be customized at any time with the Move Up (▲) / Move Down (▼) buttons or in the Gala Editor.
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
            Or add an individual custom event to this gala program, configure session order, gender, eligible age group, and qualifying times.
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
                placeholder={`Default: ${gala.defaultEventFeePence}`}
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
      )}

      {/* Sportsystems Entry File Importer for Coaches & Admins */}
      {canManage && (
        <SportsysEntryUploader galaId={gala.id} />
      )}

      {/* Registered Entries Overview */}
      <section className="panel" aria-labelledby="entries-summary-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Entry Roster</p>
            <h2 id="entries-summary-title">
              Swimmer Entries ({gala.entries.length})
            </h2>
          </div>
          <div className="portal-links">
            <Link href={`/galas/${gala.id}/heats`}>Generate Heats</Link>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Swimmer</th>
                <th>Races Entered</th>
                <th>Total Fee</th>
                <th>Payment Method</th>
                <th>Entry Status</th>
              </tr>
            </thead>
            <tbody>
              {gala.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>
                      <Link
                        href={`/swimmers/${entry.swimmer.id}`}
                        style={{ color: "var(--text-primary)", textDecoration: "none" }}
                      >
                        {entry.swimmer.firstName} {entry.swimmer.lastName}
                      </Link>
                    </strong>
                    {entry.swimmer.governingBodyId && (
                      <small>#{entry.swimmer.governingBodyId}</small>
                    )}
                  </td>
                  <td>
                    <strong>{entry.eventEntries.length} Events</strong>
                  </td>
                  <td>
                    <span className="mono-time">{formatPence(entry.totalFeePence)}</span>
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: "12px" }}>
                      {entry.paymentMethod === "STRIPE"
                        ? "Paid Card (Stripe)"
                        : entry.paymentMethod === "POOL_DESK"
                        ? "Pay at Pool Desk"
                        : "Marked Complete (Skip/Dev)"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status ${
                        entry.isPaid ? "" : "status-due-soon"
                      }`}
                    >
                      {entry.isPaid ? "Paid & Confirmed" : "Submitted / Payment Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {gala.entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No entries recorded for this gala yet. Parents can register swimmers using the Family Wizard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

