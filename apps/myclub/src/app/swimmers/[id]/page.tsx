import { notFound, redirect } from "next/navigation";
import type { PoolCourse, SwimStroke } from "@deckgala/database";
import { recordPersonalBest, syncSwimmerWithSwimEngland, updateMember } from "../../actions";
import { getActiveClub } from "../../../lib/club-context";
import { prisma } from "../../../lib/prisma";
import { calculateCompetitionAge, resolveStandardAgeGroup } from "../../../lib/age-calculator";
import {
  calculateSwimmerChampionshipSummary,
  evaluateTimeAgainstStandard,
  formatSwimTime,
  getStandardsForEvent,
} from "../../../lib/qualifying-standards";

export const dynamic = "force-dynamic";

const STROKES: Array<{ key: SwimStroke; label: string }> = [
  { key: "FREESTYLE", label: "Freestyle" },
  { key: "BACKSTROKE", label: "Backstroke" },
  { key: "BREASTSTROKE", label: "Breaststroke" },
  { key: "BUTTERFLY", label: "Butterfly" },
  { key: "INDIVIDUAL_MEDLEY", label: "Individual Medley" },
];

const DISTANCES = [50, 100, 200, 400, 800, 1500];

export default async function SwimmerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const { id: swimmerId } = await params;
  const { course: rawCourse } = await searchParams;
  const activeCourse: PoolCourse =
    rawCourse === "LONG_COURSE_METERS" ? "LONG_COURSE_METERS" : "SHORT_COURSE_METERS";

  const { clubId, role, session } = await getActiveClub();

  const [swimmer, clubSquads] = await Promise.all([
    prisma.swimmer.findFirst({
      where: { id: swimmerId, clubId },
      include: {
        squadRel: true,
        member: true,
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
            splits: {
              orderBy: { splitNumber: "asc" },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
      },
    }),
    prisma.squad.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!swimmer) notFound();

  // Access control: Parents can only view their own linked children
  if (role === "PARENT" && swimmer.member?.userId !== session.user.id) {
    redirect("/");
  }

  const canManage = role === "ADMIN" || role === "COACH";

  // Age calculations
  const competitionAge = swimmer.dateOfBirth
    ? calculateCompetitionAge(swimmer.dateOfBirth, new Date(), "AGE_DEC_31")
    : null;
  const ageGroup = competitionAge != null ? resolveStandardAgeGroup(competitionAge) : null;

  // Championship summary
  const championshipSummary =
    competitionAge != null && swimmer.gender
      ? calculateSwimmerChampionshipSummary(swimmer.personalBests, swimmer.gender, competitionAge)
      : { countyCount: 0, regionalCount: 0, nationalCount: 0 };

  // Upcoming galas in this club that are scheduled in the future
  const upcomingGalas = await prisma.gala.findMany({
    where: {
      clubId,
      startsAt: { gte: new Date() },
    },
    include: {
      events: {
        orderBy: { eventNumber: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  // Filter personal bests for active course
  const activeCoursePbs = swimmer.personalBests.filter((pb) => pb.course === activeCourse);
  const pbMap = new Map<string, (typeof swimmer.personalBests)[0]>();
  for (const pb of activeCoursePbs) {
    pbMap.set(`${pb.stroke}-${pb.distance}`, pb);
  }

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <a href="/" className="back-link">
          ← Back to Dashboard
        </a>
      </nav>

      {/* Swimmer Profile Header */}
      <section className="panel swimmer-hero-panel">
        <div className="swimmer-header-content">
          <p className="eyebrow">Competitive Profile</p>
          <h1>
            {swimmer.firstName} {swimmer.lastName}
          </h1>
          <div className="swimmer-meta-tags">
            {swimmer.squad && <span className="meta-tag squad-tag">{swimmer.squad}</span>}
            {competitionAge != null && (
              <span className="meta-tag">
                Age {competitionAge} ({ageGroup})
              </span>
            )}
            {swimmer.gender && <span className="meta-tag">{swimmer.gender}</span>}
            {swimmer.governingBodyId ? (
              <span className="meta-tag verified-tag">
                Swim England: {swimmer.governingBodyId} ✓ Verified
              </span>
            ) : (
              <span className="meta-tag unverified-tag">No Swim England ID</span>
            )}
          </div>
        </div>

        {/* Championship Trophy Tally */}
        <div className="championship-tally-bar">
          <div className="tally-card">
            <strong>{championshipSummary.countyCount}</strong>
            <span>County Cuts</span>
          </div>
          <div className="tally-card">
            <strong>{championshipSummary.regionalCount}</strong>
            <span>Regional Cuts</span>
          </div>
          <div className="tally-card">
            <strong>{championshipSummary.nationalCount}</strong>
            <span>National Cuts</span>
          </div>
        </div>

        {/* Sync with Swim England API */}
        {canManage && swimmer.governingBodyId && (
          <form action={syncSwimmerWithSwimEngland} className="sync-action-form">
            <input type="hidden" name="swimmerId" value={swimmer.id} />
            <button type="submit" className="button-secondary">
              ↻ Sync with Swim England API
            </button>
          </form>
        )}
      </section>

      {/* Course Toggle Tabs */}
      <div className="course-toggle-toolbar">
        <a
          href={`/swimmers/${swimmer.id}?course=SHORT_COURSE_METERS`}
          className={`course-tab ${activeCourse === "SHORT_COURSE_METERS" ? "course-tab-active" : ""}`}
        >
          25m Short Course
        </a>
        <a
          href={`/swimmers/${swimmer.id}?course=LONG_COURSE_METERS`}
          className={`course-tab ${activeCourse === "LONG_COURSE_METERS" ? "course-tab-active" : ""}`}
        >
          50m Long Course
        </a>
      </div>

      {/* Personal Best Matrix */}
      <section className="panel pb-matrix-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Personal Bests & Standards</p>
            <h2>Official Times Matrix ({activeCourse === "SHORT_COURSE_METERS" ? "25m" : "50m"})</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table className="pb-matrix-table">
            <thead>
              <tr>
                <th>Stroke</th>
                {DISTANCES.map((dist) => (
                  <th key={dist} style={{ textAlign: "right" }}>
                    {dist}m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STROKES.map(({ key: strokeKey, label: strokeLabel }) => (
                <tr key={strokeKey}>
                  <td>
                    <strong>{strokeLabel}</strong>
                  </td>
                  {DISTANCES.map((dist) => {
                    const pb = pbMap.get(`${strokeKey}-${dist}`);
                    const standards =
                      competitionAge != null && swimmer.gender
                        ? getStandardsForEvent(
                            strokeKey,
                            dist,
                            activeCourse,
                            swimmer.gender,
                            competitionAge,
                          )
                        : [];

                    const bestEvaluation =
                      pb && standards.length > 0
                        ? standards
                            .map((s) => evaluateTimeAgainstStandard(pb.timeMs, s))
                            .find((e) => e.status === "ACHIEVED") ??
                          standards
                            .map((s) => evaluateTimeAgainstStandard(pb.timeMs, s))
                            .find((e) => e.status === "WITHIN_REACH")
                        : null;

                    return (
                      <td key={dist} style={{ textAlign: "right" }}>
                        {pb ? (
                          <div className="pb-cell">
                            <span className="pb-time">{formatSwimTime(pb.timeMs)}</span>
                            {bestEvaluation && (
                              <span
                                className={`cut-pill cut-${bestEvaluation.status.toLowerCase().replaceAll("_", "-")}`}
                              >
                                {bestEvaluation.status === "ACHIEVED"
                                  ? `${bestEvaluation.level} ✓`
                                  : `${bestEvaluation.level}: ${bestEvaluation.deltaFormatted}`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="pb-empty">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manual PB Entry Form for Coaches */}
      {canManage && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Coach Tools</p>
              <h2>Record Verified Personal Best</h2>
            </div>
          </div>
          <form action={recordPersonalBest} className="form-grid pb-entry-form">
            <input type="hidden" name="swimmerId" value={swimmer.id} />
            <input type="hidden" name="course" value={activeCourse} />

            <label>
              Stroke
              <select name="stroke" defaultValue="FREESTYLE">
                {STROKES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Distance (m)
              <select name="distance" defaultValue="50">
                {DISTANCES.map((d) => (
                  <option key={d} value={d}>
                    {d}m
                  </option>
                ))}
              </select>
            </label>

            <label>
              Time (milliseconds)
              <input
                type="number"
                name="timeMs"
                placeholder="e.g. 28140 for 28.14"
                required
                min={1000}
              />
            </label>

            <label>
              Meet / Trial Name
              <input name="meetName" placeholder="e.g. County Qualifier" required />
            </label>

            <label>
              Date
              <input type="date" name="achievedAt" />
            </label>

            <button type="submit">Save Record</button>
          </form>
        </section>
      )}

      {/* Edit Member & Swimmer Details for Coaches and Admins */}
      {canManage && swimmer.member && (
        <section className="panel" id="edit-member" aria-labelledby="edit-member-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Administration</p>
              <h2 id="edit-member-title">Edit Member & Swimmer Details</h2>
            </div>
          </div>
          <form action={updateMember} className="form-grid">
            <input type="hidden" name="memberId" value={swimmer.member.id} />
            <input type="hidden" name="isSwimmer" value="true" />

            <label>
              First Name
              <input name="firstName" defaultValue={swimmer.firstName} required maxLength={100} />
            </label>

            <label>
              Last Name
              <input name="lastName" defaultValue={swimmer.lastName} required maxLength={100} />
            </label>

            <label>
              Email Address
              <input
                name="email"
                type="email"
                defaultValue={swimmer.member.email ?? ""}
                placeholder="e.g. swimmer@example.com"
              />
            </label>

            <label>
              Contact Phone
              <input
                name="phone"
                type="tel"
                defaultValue={swimmer.member.phone ?? ""}
                placeholder="e.g. 07700 900123"
              />
            </label>

            <label>
              Swim England ID
              <input
                name="governingBodyId"
                defaultValue={swimmer.governingBodyId ?? ""}
                placeholder="e.g. 1482931"
              />
            </label>

            <label>
              Date of Birth
              <input
                name="dateOfBirth"
                type="date"
                defaultValue={swimmer.dateOfBirth?.toISOString().slice(0, 10) ?? ""}
              />
            </label>

            <label>
              Gender
              <select name="gender" defaultValue={swimmer.gender ?? "FEMALE"}>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OPEN">Open</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Squad
              {clubSquads.length > 0 ? (
                <select
                  name="squad"
                  defaultValue={swimmer.squadRel?.name ?? swimmer.squad ?? ""}
                >
                  <option value="">Unassigned</option>
                  {clubSquads.map((sq) => (
                    <option key={sq.id} value={sq.name}>
                      {sq.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="squad"
                  defaultValue={swimmer.squad ?? ""}
                  placeholder="e.g. Senior Performance"
                />
              )}
            </label>

            <label>
              Emergency Contact Name
              <input
                name="emergencyContactName"
                defaultValue={swimmer.member.emergencyContactName ?? ""}
              />
            </label>

            <label>
              Emergency Contact Phone
              <input
                name="emergencyContactPhone"
                type="tel"
                defaultValue={swimmer.member.emergencyContactPhone ?? ""}
              />
            </label>

            <button type="submit">Update Member Details</button>
          </form>
        </section>
      )}

      {/* Gala History & Attendance */}
      <section className="panel" aria-labelledby="history-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Competition History</p>
            <h2 id="history-title">Attended Gala Races</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Meet</th>
                <th>Event</th>
                <th>Finish Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {swimmer.raceResults.map((result) => (
                <tr key={result.id}>
                  <td>{result.recordedAt.toISOString().slice(0, 10)}</td>
                  <td>
                    <strong>{result.event?.gala.name ?? "Club Session"}</strong>
                    <small>{result.event?.gala.venue ?? "Local Pool"}</small>
                  </td>
                  <td>
                    {result.event?.name ?? "Time Trial"} (
                    {result.event?.distance}m {result.event?.stroke})
                  </td>
                  <td>
                    <span className="mono-time">{formatSwimTime(result.timeMs)}</span>
                  </td>
                  <td>
                    <span className={`status status-${result.status.toLowerCase()}`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
              {swimmer.raceResults.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No gala races recorded for this swimmer yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming Gala Bookings */}
      <section className="panel" aria-labelledby="upcoming-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Upcoming Schedule</p>
            <h2 id="upcoming-title">Upcoming Club Galas</h2>
          </div>
        </div>

        <div className="meet-list">
          {upcomingGalas.map((gala) => (
            <article className="meet-card" key={gala.id}>
              <div className="meet-header">
                <div>
                  <h3>{gala.name}</h3>
                  <p>
                    {gala.venue ?? "Venue TBC"} · {gala.course === "SHORT_COURSE_METERS" ? "25m" : "50m"}
                  </p>
                </div>
                <span>{gala.startsAt.toISOString().slice(0, 10)}</span>
              </div>
              <p className="muted">{gala.events.length} events scheduled in this gala</p>
            </article>
          ))}
          {upcomingGalas.length === 0 && (
            <p className="empty">No upcoming galas currently scheduled.</p>
          )}
        </div>
      </section>
    </div>
  );
}

