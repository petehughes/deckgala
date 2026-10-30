import Link from "next/link";
import { getParentContext } from "../../lib/parent-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalasPage() {
  const { activeSwimmer } = await getParentContext();

  const galas = await prisma.gala.findMany({
    where: {
      isPublic: true,
      ...(activeSwimmer ? { clubId: activeSwimmer.clubId } : {}),
    },
    include: {
      events: true,
      venueRef: true,
      entries: activeSwimmer
        ? {
            where: { swimmerId: activeSwimmer.id },
            include: { eventEntries: true },
          }
        : false,
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Competition Fixtures</p>
          <h1>Upcoming Galas &amp; Meets</h1>
          <p className="muted">
            {activeSwimmer
              ? `Browse open meets for ${activeSwimmer.firstName} and submit event entry requests.`
              : "Browse open club meets and competitive swimming fixtures."}
          </p>
        </div>
      </section>

      {galas.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p className="muted">No upcoming galas published at this time.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {galas.map((gala) => {
            const myEntry = gala.entries && gala.entries.length > 0 ? gala.entries[0] : null;
            const courseLabel =
              gala.course === "SHORT_COURSE_METERS"
                ? "25m Short Course"
                : gala.course === "LONG_COURSE_METERS"
                ? "50m Long Course"
                : "25y Short Course Yards";

            return (
              <div key={gala.id} className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="eyebrow" style={{ margin: 0 }}>
                        {courseLabel}
                      </span>
                      {myEntry && (
                        <span className="status-badge">
                          ✓ Entered ({myEntry.status})
                        </span>
                      )}
                    </div>

                    <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>
                      {gala.name}
                    </h2>

                    <div className="muted" style={{ fontSize: "13px", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
                      <span>
                        📅 {new Date(gala.startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span>
                        📍 {gala.venueRef?.name || gala.venue || "Poolside"}
                      </span>
                      <span>
                        🏁 {gala.events.length} Events Scheduled
                      </span>
                      <span>
                        💰 Gala Base Fee: £{(gala.entryFeePence / 100).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Age Calculation Policy: <strong>{gala.ageRule === "AGE_DEC_31" ? "Age as of Dec 31" : "Age on Day of Meet"}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Link
                      href={`/galas/${gala.id}/enter`}
                      className="btn-primary"
                    >
                      {myEntry ? "View Entry Receipt →" : "Enter Swimmer →"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

