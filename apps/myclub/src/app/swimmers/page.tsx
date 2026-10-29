import Link from "next/link";
import { notFound } from "next/navigation";
import { assignSwimmerToSquad, createSwimmer } from "../actions";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";
import { calculateCompetitionAge } from "../../lib/age-calculator";

export const dynamic = "force-dynamic";

function formatDob(date: Date | null): string {
  if (!date) return "DOB not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default async function SwimmersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; squad?: string }>;
}) {
  const { query: rawQuery, squad: rawSquad } = await searchParams;
  const search = rawQuery?.trim().toLowerCase() || "";
  const squadFilter = rawSquad?.trim() || "";

  const { clubId, role, session } = await getActiveClub();

  const [club, clubSquads, allSwimmers] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    }),
    prisma.squad.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
    prisma.swimmer.findMany({
      where: role === "PARENT" ? { clubId, member: { userId: session.user.id } } : { clubId },
      include: {
        squadRel: true,
        member: true,
        personalBests: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  // Filter swimmers by search query and squad
  const filteredSwimmers = allSwimmers.filter((swimmer) => {
    const fullName = `${swimmer.firstName} ${swimmer.lastName}`.toLowerCase();
    const govId = swimmer.governingBodyId?.toLowerCase() || "";
    const matchesQuery = !search || fullName.includes(search) || govId.includes(search);

    const activeSquadName = swimmer.squadRel?.name || swimmer.squad || "";
    const activeSquadId = swimmer.squadId || "";
    const matchesSquad =
      !squadFilter ||
      activeSquadName === squadFilter ||
      activeSquadId === squadFilter ||
      (squadFilter === "unassigned" && !activeSquadName);

    return matchesQuery && matchesSquad;
  });

  const assignedCount = allSwimmers.filter((s) => s.squadId || s.squad).length;
  const unassignedCount = allSwimmers.length - assignedCount;

  return (
    <div className="page-shell">
      {/* Hero Section consistent with Dashboard and Roster */}
      <section className="hero">
        <div>
          <p className="eyebrow">Roster & Performance</p>
          <h1>Club Swimmers</h1>
          <p className="muted">
            Complete list of registered swimmers for {club.name}, tracking squad placements, ages, and certified times.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{allSwimmers.length}</strong>
            <span>Total Swimmers</span>
          </div>
          <div>
            <strong>{assignedCount}</strong>
            <span>In Squads</span>
          </div>
          <div>
            <strong>{unassignedCount}</strong>
            <span>Unassigned</span>
          </div>
          <div>
            <strong>{clubSquads.length}</strong>
            <span>Squads</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Panel consistent with .roster-filter-panel */}
      <section className="panel roster-filter-panel">
        <form method="get" className="roster-filter-form">
          <label>
            Search Swimmer
            <input
              name="query"
              defaultValue={search}
              placeholder="Search by name or Swim England ID..."
            />
          </label>
          <label>
            Filter by Squad
            <select name="squad" defaultValue={squadFilter}>
              <option value="">All Squads</option>
              <option value="unassigned">Unassigned</option>
              {clubSquads.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-secondary">
            Filter Swimmers
          </button>
        </form>
      </section>

      {/* Swimmers Table Panel */}
      <section className="panel" aria-labelledby="swimmers-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Swimmer Directory</p>
            <h2 id="swimmers-title">
              {filteredSwimmers.length} {filteredSwimmers.length === 1 ? "Swimmer" : "Swimmers"} Found
            </h2>
          </div>
          <div className="portal-links">
            <Link href="/squads">👥 Manage Squads ({clubSquads.length})</Link>
            <Link href="/roster">📋 All Members</Link>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Swimmer Name</th>
                <th>Age & DOB</th>
                <th>Gender</th>
                <th>Swim England #</th>
                <th>Assigned Squad</th>
                <th>Personal Bests</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSwimmers.map((swimmer) => {
                const compAge = swimmer.dateOfBirth
                  ? calculateCompetitionAge(swimmer.dateOfBirth, new Date(), "AGE_DEC_31")
                  : null;
                const currentSquadName = swimmer.squadRel?.name || swimmer.squad || "Unassigned";

                return (
                  <tr key={swimmer.id}>
                    {/* Swimmer Name */}
                    <td>
                      <strong>
                        <Link
                          href={`/swimmers/${swimmer.id}`}
                          style={{ color: "var(--text-primary)", textDecoration: "none" }}
                        >
                          {swimmer.firstName} {swimmer.lastName}
                        </Link>
                      </strong>
                      {swimmer.member?.email ? (
                        <small>{swimmer.member.email}</small>
                      ) : (
                        <small>No linked email</small>
                      )}
                    </td>

                    {/* Age & DOB */}
                    <td>
                      {compAge !== null ? (
                        <div>
                          <strong>Age {compAge}</strong>
                          <small>{formatDob(swimmer.dateOfBirth)}</small>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontStyle: "italic", fontSize: "11px" }}>
                          DOB needed
                        </span>
                      )}
                    </td>

                    {/* Gender */}
                    <td>
                      {swimmer.gender ? (
                        <span className="status" style={{ fontSize: "11px", padding: "3px 8px" }}>
                          {swimmer.gender === "MALE" ? "Male" : swimmer.gender === "FEMALE" ? "Female" : swimmer.gender}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Governing Body ID */}
                    <td>
                      {swimmer.governingBodyId ? (
                        <span className="mono-time">{swimmer.governingBodyId}</span>
                      ) : (
                        <span className="muted" style={{ fontStyle: "italic", fontSize: "11px" }}>
                          None
                        </span>
                      )}
                    </td>

                    {/* Squad Assignment */}
                    <td>
                      {canManage ? (
                        <form action={assignSwimmerToSquad} className="inline-assign-form">
                          <input type="hidden" name="swimmerId" value={swimmer.id} />
                          <select
                            name="squadId"
                            defaultValue={swimmer.squadId || ""}
                            aria-label={`Assign squad for ${swimmer.firstName} ${swimmer.lastName}`}
                          >
                            <option value="">Unassigned</option>
                            {clubSquads.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <button type="submit" title="Save squad assignment">
                            ✓
                          </button>
                        </form>
                      ) : (
                        <span
                          className={`meta-tag ${
                            swimmer.squadRel || swimmer.squad ? "squad-tag" : ""
                          }`}
                        >
                          {currentSquadName}
                        </span>
                      )}
                    </td>

                    {/* PBs Count */}
                    <td>
                      <span className="status">
                        {swimmer.personalBests.length} {swimmer.personalBests.length === 1 ? "PB" : "PBs"}
                      </span>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td>
                        <Link
                          href={`/swimmers/${swimmer.id}`}
                          className="button-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            textDecoration: "none",
                            fontSize: "11px",
                          }}
                        >
                          Profile & Times →
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredSwimmers.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="empty">
                    {search || squadFilter
                      ? "No swimmers match your filter criteria."
                      : "No swimmers are currently recorded for this club."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Swimmer Section consistent with form-grid panels */}
      {canManage && (
        <section className="panel" aria-labelledby="add-swimmer-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Registration</p>
              <h2 id="add-swimmer-title">Register New Swimmer</h2>
            </div>
          </div>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Directly register a swimmer into {club.name} and assign them to an initial training squad.
          </p>

          <form action={createSwimmer} className="form-grid">
            <label>
              First Name *
              <input name="firstName" required placeholder="e.g. Maya" />
            </label>

            <label>
              Last Name *
              <input name="lastName" required placeholder="e.g. Patel" />
            </label>

            <label>
              Date of Birth
              <input name="dateOfBirth" type="date" />
            </label>

            <label>
              Gender
              <select name="gender">
                <option value="">Select gender</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OPEN">Open</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Swim England #
              <input name="governingBodyId" placeholder="e.g. 1234567" />
            </label>

            <label>
              Initial Squad
              <select name="squadId">
                <option value="">Unassigned</option>
                {clubSquads.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" style={{ gridColumn: "auto" }}>
              Save Swimmer
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
