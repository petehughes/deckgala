import Link from "next/link";
import { getParentContext } from "../../lib/parent-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

function formatMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "NT";
  const hundredths = Math.round(ms / 10) % 100;
  const totalSecs = Math.floor(ms / 1000);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  const hStr = hundredths.toString().padStart(2, "0");
  const sStr = secs.toString().padStart(2, "0");
  return mins > 0 ? `${mins}:${sStr}.${hStr}` : `${secs}.${hStr}`;
}

export default async function PersonalBestsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { activeSwimmer } = await getParentContext();
  const { course = "SHORT_COURSE_METERS" } = await searchParams;

  if (!activeSwimmer) {
    return (
      <main className="page-shell">
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Swimmer Selected</h2>
          <Link href="/my-swimmers" className="btn-primary" style={{ display: "inline-flex", marginTop: "12px" }}>
            Select Swimmer
          </Link>
        </div>
      </main>
    );
  }

  const pbs = await prisma.personalBest.findMany({
    where: {
      swimmerId: activeSwimmer.id,
      course: course as "SHORT_COURSE_METERS" | "LONG_COURSE_METERS" | "SHORT_COURSE_YARDS",
    },
    orderBy: [{ stroke: "asc" }, { distance: "asc" }],
  });

  const strokes = ["FREESTYLE", "BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "INDIVIDUAL_MEDLEY"];

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Official Times &amp; Rankings</p>
          <h1>Personal Bests (PBs)</h1>
          <p className="muted">
            Tracking time progression for <strong>{activeSwimmer.firstName} {activeSwimmer.lastName}</strong> ({activeSwimmer.clubName})
          </p>
        </div>

        {/* Course Filter */}
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/personal-bests?course=SHORT_COURSE_METERS"
            className={`btn-secondary ${course === "SHORT_COURSE_METERS" ? "btn-primary" : ""}`}
            style={{ fontSize: "12px" }}
          >
            25m Short Course
          </Link>
          <Link
            href="/personal-bests?course=LONG_COURSE_METERS"
            className={`btn-secondary ${course === "LONG_COURSE_METERS" ? "btn-primary" : ""}`}
            style={{ fontSize: "12px" }}
          >
            50m Long Course
          </Link>
        </div>
      </section>

      {pbs.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p className="muted">
            No official personal best times recorded for this pool course yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {strokes.map((stroke) => {
            const strokePbs = pbs.filter((p) => p.stroke === stroke);
            if (strokePbs.length === 0) return null;

            return (
              <section key={stroke} className="panel">
                <h2 style={{ fontSize: "16px", color: "var(--accent-cyan)", marginBottom: "12px" }}>
                  {stroke}
                </h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Distance</th>
                        <th>Time</th>
                        <th>Date Achieved</th>
                        <th>Competition / Meet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strokePbs.map((pb) => (
                        <tr key={pb.id}>
                          <td><strong>{pb.distance}m</strong></td>
                          <td>
                            <span className="mono-time" style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                              {formatMs(pb.timeMs)}
                            </span>
                          </td>
                          <td>
                            {pb.achievedAt ? new Date(pb.achievedAt).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td>{pb.meetName || "Club Time Trial"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

