import { notFound } from "next/navigation";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  const { clubId, role } = await getActiveClub();

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      swimmers: {
        include: {
          personalBests: true,
        },
        orderBy: [{ squad: "asc" }, { lastName: "asc" }],
      },
    },
  });

  if (!club) notFound();

  // Group swimmers by squad
  const squadMap = new Map<string, typeof club.swimmers>();
  for (const swimmer of club.swimmers) {
    const squadName = swimmer.squad || "Unassigned";
    const list = squadMap.get(squadName) ?? [];
    list.push(swimmer);
    squadMap.set(squadName, list);
  }

  const squadEntries = Array.from(squadMap.entries());

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Training & Development</p>
          <h1>Squads</h1>
          <p className="muted">
            Organize training groups, monitor squad development, and plan seasonal promotions.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{squadEntries.length}</strong>
            <span>Active Squads</span>
          </div>
          <div>
            <strong>{club.swimmers.length}</strong>
            <span>Total Swimmers</span>
          </div>
        </div>
      </section>

      {/* Squad Cards Grid */}
      <div className="squad-grid">
        {squadEntries.map(([squadName, swimmers]) => (
          <article className="panel squad-card" key={squadName}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Training Group</p>
                <h2>{squadName}</h2>
              </div>
              <span className="meta-tag squad-tag">{swimmers.length} Swimmers</span>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Swimmer</th>
                    <th>Swim England #</th>
                    <th>PBs Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {swimmers.map((swimmer) => (
                    <tr key={swimmer.id}>
                      <td>
                        <a
                          href={`/swimmers/${swimmer.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <strong style={{ color: "var(--accent-cyan)" }}>
                            {swimmer.firstName} {swimmer.lastName} →
                          </strong>
                        </a>
                      </td>
                      <td>{swimmer.governingBodyId ?? "—"}</td>
                      <td>
                        <span className="mono-time">{swimmer.personalBests.length}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}

        {squadEntries.length === 0 && (
          <section className="panel">
            <p className="empty">No squads configured yet. Assign swimmers to squads in the roster.</p>
          </section>
        )}
      </div>
    </div>
  );
}

