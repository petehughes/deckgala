import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveClub } from "../../../../lib/club-context";
import { prisma } from "../../../../lib/prisma";
import {
  seedTimedFinals,
  type SeedingSwimmer,
} from "../../../../lib/seeding-engine";

export const dynamic = "force-dynamic";

export default async function GalaHeatsPage({
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
    },
  });

  if (!gala) notFound();

  const poolLanes = 8; // Default standard pool lanes

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <Link href={`/galas/${gala.id}`} className="back-link">
          ← Back to Gala Program
        </Link>
      </nav>

      {/* Hero Header with Print Button */}
      <section className="hero">
        <div>
          <p className="eyebrow">Poolside Competition Document</p>
          <h1>Heat Sheets: {gala.name}</h1>
          <p className="muted">
            {gala.venueRef?.name || gala.venue || "Competition Venue"} · {gala.course === "SHORT_COURSE_METERS" ? "25m Short Course" : "50m Long Course"} · {poolLanes} Lanes
          </p>
        </div>

        <div className="summary">
          <div>
            <strong>{gala.events.length}</strong>
            <span>Total Events</span>
          </div>
          <div>
            <strong>{gala.events.reduce((sum, e) => sum + e.entries.length, 0)}</strong>
            <span>Swimmer Starts</span>
          </div>
        </div>
      </section>

      {/* Program of Heats */}
      <div style={{ display: "grid", gap: "24px" }}>
        {gala.events.map((event) => {
          // Prepare swimmers list for seeding
          const seedingSwimmers: SeedingSwimmer[] = event.entries.map((ee) => ({
            swimmerId: ee.swimmerId,
            swimmerName: `${ee.galaEntry.swimmer.firstName} ${ee.galaEntry.swimmer.lastName}`,
            clubName: gala.clubId,
            seedTimeMs: ee.seedTimeMs,
          }));

          const seededHeats = seedTimedFinals(seedingSwimmers, poolLanes);

          return (
            <section key={event.id} className="panel" style={{ padding: "20px" }}>
              <div className="section-heading" style={{ marginBottom: "14px" }}>
                <div>
                  <p className="eyebrow">
                    Session {event.sessionNumber} · Event {event.eventNumber}
                  </p>
                  <h2>
                    {event.gender === "MALE" ? "Boys" : event.gender === "FEMALE" ? "Girls" : "Open"}{" "}
                    {event.distance}m {event.stroke.toLowerCase().replace(/_/g, " ")} ({event.ageGroup || "Open"})
                  </h2>
                </div>
                <span className="muted" style={{ fontSize: "12px" }}>
                  {event.entries.length} {event.entries.length === 1 ? "Swimmer" : "Swimmers"} · {seededHeats.length} {seededHeats.length === 1 ? "Heat" : "Heats"}
                </span>
              </div>

              {seededHeats.length === 0 ? (
                <p className="muted" style={{ fontStyle: "italic", fontSize: "12px" }}>
                  No swimmers entered in this event yet.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {seededHeats.map((heat) => (
                    <div key={heat.heatNumber} style={{ border: "1px solid rgba(140, 160, 186, 0.14)", borderRadius: "8px", overflow: "hidden" }}>
                      <div className="heat-sheet-banner" style={{ margin: 0, borderRadius: 0, border: "none", borderBottom: "1px solid rgba(140, 160, 186, 0.14)" }}>
                        <strong>
                          Heat {heat.heatNumber} of {heat.totalHeats}
                        </strong>
                        <span className="muted" style={{ fontSize: "11px" }}>
                          Spearhead Center Lane Allocation
                        </span>
                      </div>

                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>Lane</th>
                              <th>Swimmer Name</th>
                              <th>Seed Time</th>
                              <th>Official Time</th>
                              <th>Place</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heat.lanes.map((lane) => (
                              <tr key={lane.laneNumber}>
                                <td>
                                  <strong>Lane {lane.laneNumber}</strong>
                                </td>
                                <td>
                                  <strong>{lane.swimmerName}</strong>
                                </td>
                                <td>
                                  <span className="mono-time">{lane.seedTimeFormatted}</span>
                                </td>
                                <td>
                                  <span className="muted" style={{ fontStyle: "italic" }}>
                                    ________________
                                  </span>
                                </td>
                                <td>
                                  <span className="muted" style={{ fontStyle: "italic" }}>
                                    ____
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

