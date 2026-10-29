import { notFound } from "next/navigation";
import { getActiveClub } from "../../../../lib/club-context";
import { prisma } from "../../../../lib/prisma";
import { calculateSquadPerformance } from "../../../../lib/squad-service";

export const dynamic = "force-dynamic";

export default async function SquadPerformancePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: encodedName } = await params;
  const squadName = decodeURIComponent(encodedName);

  const { clubId } = await getActiveClub();

  const [club, squad] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      include: {
        swimmers: {
          where: {
            OR: [
              { squad: squadName === "Unassigned" ? null : squadName },
              { squadRel: { name: squadName } },
            ],
          },
          include: {
            personalBests: {
              orderBy: [{ stroke: "asc" }, { distance: "asc" }],
            },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    }),
    prisma.squad.findFirst({
      where: { clubId, name: squadName },
    }),
  ]);

  if (!club) notFound();

  const performance = calculateSquadPerformance(squadName, club.swimmers);

  const strokes = [
    { key: "FREESTYLE" as const, label: "Freestyle" },
    { key: "BACKSTROKE" as const, label: "Backstroke" },
    { key: "BREASTSTROKE" as const, label: "Breaststroke" },
    { key: "BUTTERFLY" as const, label: "Butterfly" },
    { key: "INDIVIDUAL_MEDLEY" as const, label: "Individual Medley" },
  ];

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <a href="/squads" className="back-link">
          ← Back to Squads
        </a>
      </nav>

      {/* Header & KPI Summary */}
      <section className="hero">
        <div>
          <p className="eyebrow">Coaching Intelligence</p>
          <h1>Squad Performance: {squadName}</h1>
          <p className="muted">
            Empirical progress tracking, championship standards tally, and gap analysis for upcoming training cycles.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{performance.totalSwimmers}</strong>
            <span>Swimmers</span>
          </div>
          <div>
            <strong>-{performance.totalSecondsDropped}s</strong>
            <span>Time Dropped</span>
          </div>
          <div>
            <strong>{performance.pbSuccessRatePct}%</strong>
            <span>PB Success Rate</span>
          </div>
          <div>
            <strong>{performance.totalPbs}</strong>
            <span>PBs Minted</span>
          </div>
        </div>
      </section>

      {/* High-ROI Coaching Opportunity Matrix */}
      <section className="panel coaching-opportunity-panel" aria-labelledby="opportunity-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Strategic Coaching Radar</p>
            <h2 id="opportunity-title">
              Highest-Return Opportunities: Closest to Crossing Championship Cuts
            </h2>
          </div>
        </div>
        <p className="muted">
          Events where swimmers in this squad are clustered closest to County, Regional, or National standards. Focus technical training here to achieve the highest qualification yield.
        </p>

        <div className="opportunity-list">
          {performance.topOpportunities.map((opp, index) => (
            <article className="opportunity-card" key={`${opp.stroke}-${opp.distance}-${opp.level}`}>
              <div className="opp-header">
                <div>
                  <span className="opp-rank-badge">#{index + 1} Opportunity</span>
                  <h3 className="opp-title">
                    {opp.distance}m {opp.stroke} ({opp.level} Cut: {opp.cutFormatted})
                  </h3>
                </div>
                <div className="opp-cluster-tag">
                  <strong>{opp.clusterCount}</strong> Swimmers Within Striking Distance
                </div>
              </div>

              {/* Swimmer cluster list with progress bars */}
              <div className="opp-swimmers-list">
                {opp.swimmers.map((swimmer) => (
                  <div className="opp-swimmer-row" key={swimmer.swimmerId}>
                    <div className="opp-swimmer-info">
                      <a href={`/swimmers/${swimmer.swimmerId}`} className="opp-swimmer-link">
                        <strong>{swimmer.swimmerName}</strong>
                      </a>
                      <span className="opp-swimmer-times">
                        Current PB: <strong className="mono-time">{swimmer.pbFormatted}</strong> (
                        <span className="opp-delta">{swimmer.deltaFormatted} to cut</span>)
                      </span>
                    </div>

                    <div className="opp-progress-bar-container">
                      <div
                        className="opp-progress-bar-fill"
                        style={{ width: `${swimmer.proximityPct}%` }}
                      />
                      <span className="opp-progress-text">{swimmer.proximityPct}% of Cut</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empirical Coaching Recommendation */}
              <div className="opp-coach-recommendation">
                <span className="coach-bulb-icon">💡</span>
                <p>
                  <strong>Coach Recommendation:</strong> {opp.coachingRecommendation}
                </p>
              </div>
            </article>
          ))}

          {performance.topOpportunities.length === 0 && (
            <p className="empty">
              No close qualification clusters detected yet. As more times and PBs are recorded, the gap optimizer will automatically surface training priorities.
            </p>
          )}
        </div>
      </section>

      {/* Championship Standards Tally by Stroke */}
      <section className="panel" aria-labelledby="tally-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Championship Readiness</p>
            <h2 id="tally-title">Standards Tally by Stroke Discipline</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Stroke Discipline</th>
                <th style={{ textAlign: "center" }}>County Standards</th>
                <th style={{ textAlign: "center" }}>Regional Standards</th>
                <th style={{ textAlign: "center" }}>National Standards</th>
              </tr>
            </thead>
            <tbody>
              {strokes.map(({ key, label }) => {
                const tally = performance.standardsTally[key];
                return (
                  <tr key={key}>
                    <td>
                      <strong>{label}</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="cut-pill cut-achieved" style={{ fontSize: "12px" }}>
                        {tally.county} Qualified
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="cut-pill cut-achieved" style={{ fontSize: "12px" }}>
                        {tally.regional} Qualified
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="cut-pill cut-achieved" style={{ fontSize: "12px" }}>
                        {tally.national} Qualified
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

