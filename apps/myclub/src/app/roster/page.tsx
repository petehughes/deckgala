import { notFound } from "next/navigation";
import { createMember, renewMembership } from "../actions";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

function dateLabel(date: Date | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function renewalStatus(date: Date | null): string {
  if (!date) return "Renewal date needed";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setUTCHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= 30) return "Due soon";
  return "Active";
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; squad?: string }>;
}) {
  const { query: rawQuery, squad: rawSquad } = await searchParams;
  const search = rawQuery?.trim().toLowerCase() || "";
  const squadFilter = rawSquad?.trim() || "";

  const { clubId, role, session } = await getActiveClub();

  const [club, clubSquads] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: role === "PARENT" ? { userId: session.user.id } : {},
          include: {
            swimmer: {
              include: { squadRel: true },
            },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    }),
    prisma.squad.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  // Filter members by query and squad
  const filteredMembers = club.members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const govId = member.governingBodyId?.toLowerCase() || "";
    const matchesQuery = !search || fullName.includes(search) || govId.includes(search);

    const swimmerSquad = member.swimmer?.squadRel?.name || member.swimmer?.squad || "";
    const matchesSquad = !squadFilter || swimmerSquad === squadFilter;

    return matchesQuery && matchesSquad;
  });

  // Combine squads from squad entities and any legacy string squads
  const squads = Array.from(
    new Set([
      ...clubSquads.map((s) => s.name),
      ...club.members.map((m) => m.swimmer?.squad).filter(Boolean),
    ]),
  ) as string[];

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Membership & Performance</p>
          <h1>Swimmers & Roster</h1>
          <p className="muted">
            Manage your registered swimmers, emergency details, and governing body verifications.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{club.members.length}</strong>
            <span>Total Members</span>
          </div>
          <div>
            <strong>{club.members.filter((m) => m.swimmer != null).length}</strong>
            <span>Active Swimmers</span>
          </div>
          <div>
            <strong>{squads.length}</strong>
            <span>Squads</span>
          </div>
        </div>
      </section>

      {/* Roster Controls: Search & Filter */}
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
              {squads.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-secondary">
            Filter Roster
          </button>
        </form>
      </section>

      {/* Roster Table */}
      <section className="panel" aria-labelledby="roster-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Roster Directory</p>
            <h2 id="roster-title">
              {filteredMembers.length} {filteredMembers.length === 1 ? "Swimmer" : "Swimmers"} Found
            </h2>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Swimmer / Member</th>
                <th>Squad / Category</th>
                <th>Contact</th>
                <th>Membership</th>
                <th>Renew Through</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    {member.swimmer ? (
                      <a
                        href={`/swimmers/${member.swimmer.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <strong style={{ color: "var(--accent-cyan)" }}>
                          {member.firstName} {member.lastName} →
                        </strong>
                      </a>
                    ) : (
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                    )}
                    <small>
                      {member.governingBodyId
                        ? `Swim England: ${member.governingBodyId}`
                        : "No governing body ID recorded"}
                    </small>
                  </td>
                  <td>
                    {member.swimmer?.squad ? (
                      <span className="meta-tag squad-tag">{member.swimmer.squad}</span>
                    ) : (
                      <span className="muted">No Squad</span>
                    )}
                    <small>{member.swimmer?.gender ?? ""}</small>
                  </td>
                  <td>
                    <div>{member.email ?? member.phone ?? "No contact details"}</div>
                    {member.emergencyContactName && (
                      <small>
                        Emerg: {member.emergencyContactName} ({member.emergencyContactPhone})
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status status-${renewalStatus(member.membershipExpiresAt).toLowerCase().replaceAll(" ", "-")}`}
                    >
                      {renewalStatus(member.membershipExpiresAt)}
                    </span>
                  </td>
                  <td>
                    {canManage ? (
                      <form action={renewMembership} className="renew-form">
                        <input type="hidden" name="memberId" value={member.id} />
                        <input
                          type="date"
                          name="membershipExpiresAt"
                          defaultValue={member.membershipExpiresAt?.toISOString().slice(0, 10)}
                          required
                          aria-label={`Renew ${member.firstName} ${member.lastName} through`}
                        />
                        <button type="submit" className="button-secondary">
                          Save
                        </button>
                      </form>
                    ) : (
                      dateLabel(member.membershipExpiresAt)
                    )}
                  </td>
                  {canManage && (
                    <td>
                      {member.swimmer ? (
                        <a
                          href={`/swimmers/${member.swimmer.id}#edit-member`}
                          className="button-secondary"
                          style={{
                            textDecoration: "none",
                            fontSize: "11px",
                            padding: "6px 10px",
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Edit Details
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="empty">
                    No swimmers match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Swimmer Form for Admins and Coaches */}
      {canManage && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Registration</p>
              <h2>Add New Swimmer to Roster</h2>
            </div>
          </div>
          <form action={createMember} className="form-grid">
            <label>
              First name
              <input name="firstName" required maxLength={100} />
            </label>
            <label>
              Last name
              <input name="lastName" required maxLength={100} />
            </label>
            <label>
              Date of Birth
              <input name="dateOfBirth" type="date" required />
            </label>
            <label>
              Gender
              <select name="gender" defaultValue="FEMALE">
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OPEN">Open</option>
              </select>
            </label>
            <label>
              Squad
              <input name="squad" placeholder="e.g. Senior Performance" />
            </label>
            <label>
              Swim England ID
              <input name="governingBodyId" placeholder="e.g. 1482931" />
            </label>
            <label>
              Email
              <input name="email" type="email" />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" />
            </label>
            <label>
              Emergency contact
              <input name="emergencyContactName" />
            </label>
            <label>
              Emergency phone
              <input name="emergencyContactPhone" type="tel" />
            </label>
            <button type="submit">Add Swimmer</button>
          </form>
        </section>
      )}
    </div>
  );
}

