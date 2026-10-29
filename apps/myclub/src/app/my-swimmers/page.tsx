import { redirect } from "next/navigation";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";
import { calculateCompetitionAge, resolveStandardAgeGroup } from "../../lib/age-calculator";
import { formatSwimTime } from "../../lib/qualifying-standards";

export const dynamic = "force-dynamic";

export default async function MySwimmersPage() {
  const { clubId, session } = await getActiveClub();

  // Find all members/swimmers linked to this parent account
  const linkedMembers = await prisma.member.findMany({
    where: {
      clubId,
      userId: session.user.id,
    },
    include: {
      swimmer: {
        include: {
          personalBests: {
            orderBy: [{ stroke: "asc" }, { distance: "asc" }],
          },
          raceResults: {
            include: {
              event: {
                include: {
                  gala: true,
                },
              },
            },
            orderBy: { recordedAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Family Portal</p>
          <h1>My Swimmers</h1>
          <p className="muted">
            Track your children’s personal best progressions, qualification status, and upcoming galas.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{linkedMembers.length}</strong>
            <span>Swimmers</span>
          </div>
        </div>
      </section>

      <div className="swimmer-family-grid">
        {linkedMembers.map((member) => {
          const swimmer = member.swimmer;
          if (!swimmer) return null;

          const age = swimmer.dateOfBirth
            ? calculateCompetitionAge(swimmer.dateOfBirth, new Date(), "AGE_DEC_31")
            : null;
          const ageGroup = age != null ? resolveStandardAgeGroup(age) : null;

          return (
            <article className="panel swimmer-family-card" key={member.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{swimmer.squad || "Club Swimmer"}</p>
                  <h2>
                    {swimmer.firstName} {swimmer.lastName}
                  </h2>
                  <p className="muted">
                    {age != null ? `Age ${age} (${ageGroup})` : "Age not set"} ·{" "}
                    {swimmer.governingBodyId
                      ? `Swim England: ${swimmer.governingBodyId}`
                      : "No governing body ID"}
                  </p>
                </div>
                <a href={`/swimmers/${swimmer.id}`} className="button-secondary">
                  View Full Profile & PB Matrix →
                </a>
              </div>

              {/* Personal Bests Highlight */}
              <div className="family-swimmer-pbs">
                <h3>Key Personal Bests</h3>
                <div className="pb-mini-grid">
                  {swimmer.personalBests.slice(0, 6).map((pb) => (
                    <div className="pb-mini-item" key={pb.id}>
                      <span className="pb-mini-label">
                        {pb.distance}m {pb.stroke.slice(0, 4)}
                      </span>
                      <strong className="mono-time">{formatSwimTime(pb.timeMs)}</strong>
                    </div>
                  ))}
                  {swimmer.personalBests.length === 0 && (
                    <p className="muted">No personal bests recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Recent Races */}
              <div className="family-swimmer-history">
                <h3>Recent Races</h3>
                {swimmer.raceResults.map((result) => (
                  <div className="recent-race-row" key={result.id}>
                    <div>
                      <strong>{result.event?.gala.name || "Club Meet"}</strong>
                      <small>
                        {result.event?.name} · {result.recordedAt.toISOString().slice(0, 10)}
                      </small>
                    </div>
                    <span className="mono-time">{formatSwimTime(result.timeMs)}</span>
                  </div>
                ))}
                {swimmer.raceResults.length === 0 && (
                  <p className="muted">No recent race results.</p>
                )}
              </div>
            </article>
          );
        })}

        {linkedMembers.length === 0 && (
          <section className="panel">
            <p className="empty">
              No swimmer records are linked to your account yet. Contact your club secretary to link your child’s membership.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

